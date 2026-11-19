"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, PenLine, Send, Trash2 } from "lucide-react";
import { salvarAssinaturaCliente } from "@/app/(app)/servicos/actions";
import { AssinaturaPad } from "@/components/assinatura/assinatura-pad";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PillTabs } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/client";
import { BUCKET_ASSINATURAS } from "@/lib/assinaturas";
import { docNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { PdfPrevia } from "./pdf-previa";

type Formato = "a4" | "celular";
const CHAVE_FORMATO = "tecdesk:pdf-formato";

/**
 * Compartilhar o PDF da OS: prévia com abas (padrão / mobile), assinatura do cliente na tela,
 * Baixar OS e Enviar OS (abre o menu de compartilhar do aparelho: WhatsApp, salvar etc.).
 */
export function CompartilharPdf({ open, onClose, id, numero }: { open: boolean; onClose: () => void; id: string; numero: number }) {
  const { t, fmt } = useI18n();
  const [formato, setFormato] = useState<Formato>("a4");
  const [versao, setVersao] = useState(0);
  const [pdf, setPdf] = useState<ArrayBuffer | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [assinando, setAssinando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [assinadoEm, setAssinadoEm] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE_FORMATO) === "celular") setFormato("celular");
    } catch {
      // sem armazenamento: fica no padrão
    }
  }, []);

  // Se o cliente já assinou esta OS.
  useEffect(() => {
    if (!open) return;
    void createClient()
      .from("base_atendimentos")
      .select("assinatura_cliente_em")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setAssinadoEm(data?.assinatura_cliente_em ?? null));
  }, [open, id]);

  const cel = formato === "celular";
  const url = `/api/pdf/os/${id}?${cel ? "formato=celular&" : ""}v=${versao}`;
  const nome = `${t("OS")}-${docNumber(numero)}${cel ? "-celular" : ""}.pdf`;

  // Gera o PDF uma vez por formato; a mesma cópia serve para a prévia, baixar e enviar.
  const carregar = useCallback(async () => {
    setPdf(null);
    setErro(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("pdf");
      setPdf(await res.arrayBuffer());
    } catch {
      setErro(t("Não foi possível gerar o PDF agora."));
    }
  }, [url, t]);
  useEffect(() => {
    if (open) void carregar();
  }, [open, carregar]);

  function escolher(f: Formato) {
    setFormato(f);
    try {
      window.localStorage.setItem(CHAVE_FORMATO, f);
    } catch {
      // ignora
    }
  }

  function arquivo() {
    return pdf ? new File([pdf], nome, { type: "application/pdf" }) : null;
  }

  function baixar() {
    const f = arquivo();
    if (!f) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function enviar() {
    const f = arquivo();
    if (!f) return;
    setEnviando(true);
    try {
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], title: `${t("Ordem de serviço")} ${docNumber(numero)}` });
      } else {
        // Computador sem compartilhamento: baixa para anexar no WhatsApp Web ou no e-mail.
        baixar();
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setErro(t("Não foi possível enviar agora. Tente baixar o PDF."));
    } finally {
      setEnviando(false);
    }
  }

  async function salvarAssinatura(png: Blob | null) {
    setSalvando(true);
    setErro(null);
    try {
      const supabase = createClient();
      let path: string | null = null;
      if (png) {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user.id;
        if (!uid) throw new Error();
        path = `${uid}/cliente-${id}-${Date.now()}.png`;
        const { error } = await supabase.storage.from(BUCKET_ASSINATURAS).upload(path, png, { contentType: "image/png", upsert: false });
        if (error) throw error;
      }
      const r = await salvarAssinaturaCliente(id, path);
      if (!r.ok) throw new Error(r.error);
      setAssinadoEm(r.data.em);
      setAssinando(false);
      setVersao((v) => v + 1); // gera o PDF de novo, já com a assinatura
    } catch {
      setErro(t("Não foi possível salvar a assinatura agora. Tente de novo."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      overline={t("OS {n}", { n: docNumber(numero) })}
      title={t("Compartilhar PDF")}
      footer={
        assinando ? undefined : (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button variant="outline" icon={<Download />} onClick={baixar} disabled={!pdf}>
              {t("Baixar OS")}
            </Button>
            <Button variant="dark" icon={enviando ? <Loader2 className="animate-spin" /> : <Send />} onClick={enviar} disabled={!pdf || enviando}>
              {t("Enviar OS")}
            </Button>
          </div>
        )
      }
    >
      <div className="grid gap-4">
        {assinando ? (
          <div className="grid gap-2">
            <p className="text-[13px] text-ink-muted">{t("Peça para o cliente assinar com o dedo no quadro abaixo.")}</p>
            <AssinaturaPad
              rotulo={t("Assinatura do cliente")}
              salvando={salvando}
              onSalvar={(png) => void salvarAssinatura(png)}
              onCancelar={() => setAssinando(false)}
            />
          </div>
        ) : (
          <>
            <PillTabs<Formato>
              items={[
                { value: "a4", label: t("PDF padrão") },
                { value: "celular", label: t("PDF mobile") },
              ]}
              value={formato}
              onChange={escolher}
            />
            <PdfPrevia dados={pdf} />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" icon={<PenLine />} onClick={() => setAssinando(true)} className="flex-1 sm:flex-none">
                {assinadoEm ? t("Assinar de novo") : t("Assinar PDF")}
              </Button>
              {assinadoEm ? (
                <>
                  <span className="text-xs text-ink-subtle">
                    {t("Assinado pelo cliente em {data}", { data: fmt.date(new Date(assinadoEm).toLocaleDateString("sv-SE")) })}
                  </span>
                  <Button variant="ghost" icon={<Trash2 />} onClick={() => void salvarAssinatura(null)} disabled={salvando} aria-label={t("Remover assinatura")} />
                </>
              ) : null}
            </div>
          </>
        )}
        {erro ? <p className="text-[13px] text-danger">{erro}</p> : null}
      </div>
    </Modal>
  );
}

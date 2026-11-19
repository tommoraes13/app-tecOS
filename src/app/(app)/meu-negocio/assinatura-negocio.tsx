"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, PenLine, Trash2 } from "lucide-react";
import { AssinaturaPad } from "@/components/assinatura/assinatura-pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/components/ui/controls";
import { useI18n } from "@/i18n/client";
import { BUCKET_ASSINATURAS, prepararAssinaturaEnviada } from "@/lib/assinaturas";
import { createClient } from "@/lib/supabase/client";
import { salvarAssinaturaEmpresa } from "./actions";

/** Assinatura da empresa: desenhar na tela ou enviar uma imagem. Sai em todos os PDFs. */
export function AssinaturaNegocio({ userId, path }: { userId: string; path: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const arquivo = useRef<HTMLInputElement>(null);
  const [atual, setAtual] = useState<string | null>(null);
  const [desenhando, setDesenhando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // A pasta é privada: baixa a imagem com o login do técnico para mostrar.
  useEffect(() => {
    if (!path) return setAtual(null);
    let url: string | null = null;
    void createClient()
      .storage.from(BUCKET_ASSINATURAS)
      .download(path)
      .then(({ data }) => {
        if (data) {
          url = URL.createObjectURL(data);
          setAtual(url);
        }
      });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);

  async function enviar(png: Blob) {
    setEnviando(true);
    setMsg(null);
    try {
      const novo = `${userId}/empresa-${Date.now()}.png`;
      const { error } = await createClient().storage.from(BUCKET_ASSINATURAS).upload(novo, png, { contentType: "image/png", upsert: false });
      if (error) throw error;
      const r = await salvarAssinaturaEmpresa(novo);
      if (!r.ok) throw new Error(r.error);
      setAtual(URL.createObjectURL(png));
      setDesenhando(false);
      setMsg({ kind: "ok", text: t("Assinatura salva. Ela já sai nos próximos PDFs.") });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: t("Não foi possível salvar a assinatura agora. Tente de novo.") });
    } finally {
      setEnviando(false);
    }
  }

  async function escolherArquivo(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setMsg({ kind: "error", text: t("Escolha uma imagem (JPG, PNG ou WEBP).") });
    if (file.size > 15 * 1024 * 1024) return setMsg({ kind: "error", text: t("A imagem é muito grande. Use uma de até 15 MB.") });
    const png = await prepararAssinaturaEnviada(file).catch(() => null);
    if (!png) return setMsg({ kind: "error", text: t("Não encontramos a assinatura na imagem. Use uma foto com fundo claro.") });
    await enviar(png);
  }

  async function remover() {
    setEnviando(true);
    const r = await salvarAssinaturaEmpresa(null);
    setEnviando(false);
    if (!r.ok) return setMsg({ kind: "error", text: t(r.error) });
    setAtual(null);
    router.refresh();
  }

  return (
    <Card className="grid gap-4 p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{t("Assinatura da empresa")}</h2>

      {desenhando ? (
        <AssinaturaPad rotulo={t("Assine aqui")} salvando={enviando} onSalvar={enviar} onCancelar={() => setDesenhando(false)} />
      ) : (
        <>
          <div className="grid h-28 place-items-center rounded-lg border border-dashed border-border bg-white">
            {atual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={atual} alt={t("Assinatura da empresa")} className="max-h-24 max-w-[80%] object-contain" />
            ) : (
              <span className="text-[13px] text-neutral-400">{t("Nenhuma assinatura")}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<PenLine />} onClick={() => setDesenhando(true)} disabled={enviando}>
              {atual ? t("Assinar de novo") : t("Desenhar assinatura")}
            </Button>
            <Button variant="outline" icon={<ImageUp />} onClick={() => arquivo.current?.click()} disabled={enviando}>
              {t("Enviar imagem")}
            </Button>
            {atual ? (
              <Button variant="danger" icon={<Trash2 />} onClick={remover} disabled={enviando}>
                {t("Remover")}
              </Button>
            ) : null}
            <input
              ref={arquivo}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void escolherArquivo(f);
              }}
            />
          </div>
        </>
      )}
      {msg ? <Feedback kind={msg.kind}>{msg.text}</Feedback> : null}
    </Card>
  );
}

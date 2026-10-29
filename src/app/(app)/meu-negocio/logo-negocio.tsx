"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/components/ui/controls";
import { useI18n } from "@/i18n/client";
import { avatarUrl } from "@/lib/avatar";
import { canvasParaPng, desenharLogo, iniciaisDoNegocio, prepararLogoEnviado, TOTAL_LOGOS } from "@/lib/logos";
import { createClient } from "@/lib/supabase/client";
import { salvarLogo } from "./actions";

/** Logotipo do negócio, que sai no topo dos PDFs: enviar uma imagem ou gerar um simples na hora. */
export function LogoNegocio({ userId, logoPath, nome }: { userId: string; logoPath: string | null; nome: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const arquivo = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [atual, setAtual] = useState<string | null>(avatarUrl(logoPath));
  const [gerado, setGerado] = useState<number | null>(null);
  const [ordem] = useState(() => [...Array(TOTAL_LOGOS).keys()].sort(() => Math.random() - 0.5));
  const [passo, setPasso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (gerado !== null && canvas.current) desenharLogo(canvas.current, gerado, iniciaisDoNegocio(nome));
  }, [gerado, nome]);

  async function enviar(blob: Blob) {
    setEnviando(true);
    setMsg(null);
    try {
      const path = `${userId}/logo-${Date.now()}.png`;
      const { error } = await createClient().storage.from("avatars").upload(path, blob, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const r = await salvarLogo(path);
      if (!r.ok) throw new Error(r.error);
      setAtual(URL.createObjectURL(blob));
      setGerado(null);
      setMsg({ kind: "ok", text: t("Logotipo salvo. Ele já sai nos próximos PDFs.") });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: t("Não foi possível salvar o logotipo agora. Tente de novo.") });
    } finally {
      setEnviando(false);
    }
  }

  async function escolherArquivo(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setMsg({ kind: "error", text: t("Escolha uma imagem (JPG, PNG ou WEBP).") });
    if (file.size > 15 * 1024 * 1024) return setMsg({ kind: "error", text: t("A imagem é muito grande. Use uma de até 15 MB.") });
    try {
      await enviar(await prepararLogoEnviado(file));
    } catch {
      setMsg({ kind: "error", text: t("Não foi possível salvar o logotipo agora. Tente de novo.") });
    }
  }

  function gerarOutro() {
    setMsg(null);
    setGerado(ordem[passo % ordem.length]);
    setPasso((p) => p + 1);
  }

  async function remover() {
    setEnviando(true);
    const r = await salvarLogo(null);
    setEnviando(false);
    if (!r.ok) return setMsg({ kind: "error", text: t(r.error) });
    setAtual(null);
    router.refresh();
  }

  return (
    <Card className="grid gap-4 p-5 sm:p-6">
      <div>
        <h2 className="text-[15px] font-semibold">{t("Logotipo")}</h2>
        <p className="text-[13px] text-ink-subtle">{t("Aparece no topo das OS e dos orçamentos em PDF.")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-muted">
          {gerado !== null ? (
            <canvas ref={canvas} className="size-full" aria-label={t("Prévia do logotipo gerado")} role="img" />
          ) : atual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={atual} alt={t("Logotipo atual")} className="size-full object-contain" />
          ) : (
            <span className="px-2 text-center text-xs text-ink-subtle">{t("Sem logotipo")}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={arquivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void escolherArquivo(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" icon={enviando ? <Loader2 className="animate-spin" /> : <ImageUp />} disabled={enviando} onClick={() => arquivo.current?.click()}>
            {t("Enviar imagem")}
          </Button>
          <Button variant="outline" icon={<Shuffle />} disabled={enviando} onClick={gerarOutro}>
            {gerado === null ? t("Gerar aleatoriamente") : t("Gerar outro")}
          </Button>
          {gerado !== null ? (
            <Button
              variant="dark"
              icon={<Check />}
              disabled={enviando}
              onClick={async () => canvas.current && enviar(await canvasParaPng(canvas.current))}
            >
              {t("Usar este")}
            </Button>
          ) : null}
          {atual && gerado === null ? (
            <Button variant="ghost" icon={<Trash2 />} disabled={enviando} onClick={remover}>
              {t("Remover")}
            </Button>
          ) : null}
        </div>
      </div>
      {gerado !== null ? (
        <p className="text-xs text-ink-subtle">{t("Opção {n} de {total}, com as iniciais do nome fantasia.", { n: (passo - 1) % TOTAL_LOGOS + 1, total: TOTAL_LOGOS })}</p>
      ) : null}
      {msg ? <Feedback kind={msg.kind}>{msg.text}</Feedback> : null}
    </Card>
  );
}

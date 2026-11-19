"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Share2, Smartphone } from "lucide-react";
import { CompartilharPdf } from "./compartilhar-pdf";
import { useI18n } from "@/i18n/client";
import { docNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-muted disabled:opacity-50";

/**
 * PDF do documento. OS: um botão "Compartilhar PDF" que abre a prévia, a assinatura do cliente,
 * Baixar OS e Enviar OS. Orçamento: ver, baixar e enviar.
 */
export function PdfActions(props: { tipo: "os" | "orcamento"; id: string; numero: number; className?: string }) {
  return props.tipo === "os" ? <BotaoCompartilharOs {...props} /> : <PdfActionsOrcamento {...props} />;
}

function BotaoCompartilharOs({ id, numero, className }: { id: string; numero: number; className?: string }) {
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  return (
    <div className={cn("grid", className)}>
      <button type="button" onClick={() => setAberto(true)} className={cn(btn, "h-11")}>
        <Share2 className="size-4" />
        {t("Compartilhar PDF")}
      </button>
      {aberto ? <CompartilharPdf open onClose={() => setAberto(false)} id={id} numero={numero} /> : null}
    </div>
  );
}

/** Orçamento: ver/imprimir, baixar e compartilhar o PDF (no celular, abre o menu de compartilhar do aparelho). */
function PdfActionsOrcamento({
  tipo,
  id,
  numero,
  className,
}: {
  tipo: "os" | "orcamento";
  id: string;
  numero: number;
  className?: string;
}) {
  const { t } = useI18n();
  const [sharing, setSharing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Modelo do PDF: folha A4 ou estreito para celular (lembrado neste aparelho).
  const [formato, setFormato] = useState<"a4" | "celular">("a4");
  useEffect(() => {
    try {
      if (window.localStorage.getItem("tecdesk:pdf-formato") === "celular") setFormato("celular");
    } catch {
      // sem armazenamento: fica A4
    }
  }, []);
  function escolher(f: "a4" | "celular") {
    setFormato(f);
    try {
      window.localStorage.setItem("tecdesk:pdf-formato", f);
    } catch {
      // ignora
    }
  }
  const cel = formato === "celular";
  const url = `/api/pdf/${tipo}/${id}${cel ? "?formato=celular" : ""}`;
  const baixarUrl = `/api/pdf/${tipo}/${id}?baixar=1${cel ? "&formato=celular" : ""}`;
  const nome = `${tipo === "os" ? t("OS") : t("Orcamento@@arquivo")}-${docNumber(numero)}${cel ? "-celular" : ""}.pdf`;

  async function compartilhar() {
    setErro(null);
    setSharing(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("pdf");
      const blob = await res.blob();
      const file = new File([blob], nome, { type: "application/pdf" });
      const titulo = `${tipo === "os" ? t("Ordem de serviço") : t("Orçamento")} ${docNumber(numero)}`;
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: titulo });
      } else {
        // Computador sem compartilhamento nativo: baixa o arquivo para anexar no WhatsApp ou e-mail.
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = nome;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setErro(t("Não foi possível gerar o PDF agora."));
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-muted p-1" role="radiogroup" aria-label={t("Modelo do PDF")}>
        {(
          [
            { v: "a4", label: t("PDF A4"), icon: FileText },
            { v: "celular", label: t("PDF para celular"), icon: Smartphone },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={formato === o.v}
            onClick={() => escolher(o.v)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium",
              formato === o.v ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
            )}
          >
            <o.icon className="size-3.5" />
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noreferrer" className={btn}>
          <FileText className="size-4" />
          {t("Ver PDF")}
        </a>
        <a href={baixarUrl} className={btn} aria-label={t("Baixar PDF")}>
          <Download className="size-4" />
          {t("Baixar")}
        </a>
        <button type="button" onClick={compartilhar} disabled={sharing} className={btn}>
          {sharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          {t("Enviar")}
        </button>
      </div>
      {erro ? <p className="text-xs text-danger">{erro}</p> : null}
    </div>
  );
}

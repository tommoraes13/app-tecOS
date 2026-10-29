"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Share2 } from "lucide-react";
import { docNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-muted disabled:opacity-50";

/** Ver/imprimir, baixar e compartilhar o PDF (no celular, abre o menu de compartilhar do aparelho). */
export function PdfActions({
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
  const [sharing, setSharing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const url = `/api/pdf/${tipo}/${id}`;
  const nome = `${tipo === "os" ? "OS" : "Orcamento"}-${docNumber(numero)}.pdf`;

  async function compartilhar() {
    setErro(null);
    setSharing(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("pdf");
      const blob = await res.blob();
      const file = new File([blob], nome, { type: "application/pdf" });
      const titulo = `${tipo === "os" ? "Ordem de serviço" : "Orçamento"} ${docNumber(numero)}`;
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
      if (!(e instanceof DOMException && e.name === "AbortError")) setErro("Não foi possível gerar o PDF agora.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noreferrer" className={btn}>
          <FileText className="size-4" />
          Ver PDF
        </a>
        <a href={`${url}?baixar=1`} className={btn} aria-label="Baixar PDF">
          <Download className="size-4" />
          Baixar
        </a>
        <button type="button" onClick={compartilhar} disabled={sharing} className={btn}>
          {sharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          Enviar
        </button>
      </div>
      {erro ? <p className="text-xs text-danger">{erro}</p> : null}
    </div>
  );
}

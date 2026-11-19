"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/client";

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let carregando: Promise<PdfJs> | null = null;

/** Carrega o leitor de PDF só quando a prévia abre (é um arquivo grande). */
function pdfjs(): Promise<PdfJs> {
  carregando ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    return m;
  });
  return carregando;
}

/** Prévia do PDF desenhada na tela (funciona igual no iPhone, no Android e no computador). */
export function PdfPrevia({ dados }: { dados: ArrayBuffer | null }) {
  const { t } = useI18n();
  const caixa = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const alvo = caixa.current;
    if (!dados || !alvo) return;
    let cancelado = false;
    setErro(false);
    setPronto(false);
    (async () => {
      try {
        const lib = await pdfjs();
        // Copia os bytes: o leitor fica com o original e o arquivo ainda é usado para baixar e enviar.
        const doc = await lib.getDocument({ data: dados.slice(0), isEvalSupported: false }).promise;
        const largura = alvo.clientWidth || 360;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const paginas: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const pagina = await doc.getPage(n);
          const base = pagina.getViewport({ scale: 1 });
          const vp = pagina.getViewport({ scale: (largura / base.width) * dpr });
          const c = document.createElement("canvas");
          c.width = Math.floor(vp.width);
          c.height = Math.floor(vp.height);
          c.style.width = "100%";
          c.className = "block rounded-sm bg-white shadow-card";
          const ctx = c.getContext("2d");
          if (!ctx) continue;
          await pagina.render({ canvasContext: ctx, viewport: vp }).promise;
          if (cancelado) return;
          paginas.push(c);
        }
        if (cancelado) return;
        alvo.replaceChildren(...paginas);
        setPronto(true);
        void doc.destroy();
      } catch {
        if (!cancelado) setErro(true);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [dados]);

  return (
    <div className="relative min-h-64 rounded-lg bg-surface-muted p-2 sm:p-3">
      <div ref={caixa} className="grid gap-3" />
      {!pronto && !erro ? (
        <div className="absolute inset-0 grid place-items-center text-[13px] text-ink-subtle">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {t("Gerando a prévia…")}
          </span>
        </div>
      ) : null}
      {erro ? (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-[13px] text-ink-subtle">
          {t("Não foi possível mostrar a prévia. Você ainda pode baixar ou enviar o PDF.")}
        </p>
      ) : null}
    </div>
  );
}

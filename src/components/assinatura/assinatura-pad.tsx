"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { recortarAssinatura } from "@/lib/assinaturas";

/** Quadro para assinar com o dedo ou o mouse. Devolve um PNG recortado e com fundo transparente. */
export function AssinaturaPad({
  rotulo,
  salvando = false,
  onSalvar,
  onCancelar,
}: {
  rotulo: string;
  salvando?: boolean;
  onSalvar: (png: Blob) => void;
  onCancelar: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const [vazio, setVazio] = useState(true);

  // Ajusta o tamanho real do quadro à tela (nítido em celular).
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#141e46";
  }, []);

  function ponto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function inicio(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    desenhando.current = true;
    ultimo.current = ponto(e);
    const ctx = e.currentTarget.getContext("2d");
    if (ctx && ultimo.current) {
      ctx.beginPath();
      ctx.arc(ultimo.current.x, ultimo.current.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "#141e46";
      ctx.fill();
    }
    setVazio(false);
  }
  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current || !ultimo.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = ponto(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo.current = p;
  }
  function fim() {
    desenhando.current = false;
    ultimo.current = null;
  }
  function limpar() {
    const c = ref.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setVazio(true);
  }
  async function salvar() {
    if (!ref.current) return;
    const png = await recortarAssinatura(ref.current);
    if (png) onSalvar(png);
  }

  return (
    <div className="grid gap-3">
      <div className="relative rounded-lg border border-border-control bg-white">
        <canvas
          ref={ref}
          aria-label={rotulo}
          className="block h-[200px] w-full touch-none rounded-lg sm:h-[220px]"
          onPointerDown={inicio}
          onPointerMove={mover}
          onPointerUp={fim}
          onPointerCancel={fim}
          onPointerLeave={fim}
        />
        <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-dashed border-neutral-300" />
        {vazio ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-neutral-400">{rotulo}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" icon={<Eraser />} onClick={limpar} disabled={vazio || salvando}>
          {t("Limpar")}
        </Button>
        <span className="flex-1" />
        <Button variant="outline" onClick={onCancelar} disabled={salvando}>
          {t("Cancelar")}
        </Button>
        <Button variant="dark" onClick={salvar} disabled={vazio || salvando}>
          {salvando ? t("Salvando…") : t("Salvar assinatura")}
        </Button>
      </div>
    </div>
  );
}

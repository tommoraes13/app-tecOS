"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";

type Barra = { inicio: string; fim: string; valor: number };

/** Ganhos no período: uma série de barras (valor recebido), com dica ao passar o dedo ou o mouse. */
export function GanhosChart({ barras, porSemana }: { barras: Barra[]; porSemana: boolean }) {
  const { t, fmt } = useI18n();
  const { dateShort, money } = fmt;
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const padL = 56;
  const padB = 28;
  const padT = 12;
  const max = Math.max(...barras.map((b) => b.valor), 0);
  const topo = max > 0 ? niceMax(max) : 100;
  const ticks = [0, topo / 2, topo];
  const plotW = W - padL - 8;
  const plotH = H - padT - padB;
  const slot = plotW / Math.max(1, barras.length);
  const barW = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => padT + plotH - (v / topo) * plotH;
  const labelEvery = Math.ceil(barras.length / 8);

  const rotulo = (b: Barra) => (porSemana ? t("{inicio} a {fim}", { inicio: dateShort(b.inicio), fim: dateShort(b.fim) }) : dateShort(b.inicio));
  const ativa = hover !== null ? barras[hover] : null;

  return (
    <div className="relative px-2 pb-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t("Valor recebido no período")}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={padL} x2={W - 8} y1={y(tk)} y2={y(tk)} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 8} y={y(tk) + 4} textAnchor="end" fontSize="11" fill="var(--ink-subtle)">
              {money(tk, { noCents: true })}
            </text>
          </g>
        ))}
        {barras.map((b, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const h = Math.max(0, plotH - (y(b.valor) - padT));
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={b.inicio}>
              {/* Área de toque maior que a barra */}
              <rect
                x={padL + i * slot}
                y={padT}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(i)}
              />
              {h > 0 ? (
                <path
                  d={`M${x},${padT + plotH} V${padT + plotH - h + r} Q${x},${padT + plotH - h} ${x + r},${padT + plotH - h} H${x + barW - r} Q${x + barW},${padT + plotH - h} ${x + barW},${padT + plotH - h + r} V${padT + plotH} Z`}
                  fill="var(--brand-500)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  pointerEvents="none"
                />
              ) : null}
              {i % labelEvery === 0 ? (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-subtle)">
                  {dateShort(b.inicio)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {ativa ? (
        <div className="pointer-events-none absolute top-1 right-4 rounded-lg bg-surface px-3 py-2 text-xs shadow-pop">
          <div className="text-ink-subtle">{rotulo(ativa)}</div>
          <div className="text-sm font-semibold tabular-nums">{money(ativa.valor)}</div>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>{t(porSemana ? "Valor recebido por semana" : "Valor recebido por dia")}</caption>
        <tbody>
          {barras.map((b) => (
            <tr key={b.inicio}>
              <td>{rotulo(b)}</td>
              <td>{money(b.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function niceMax(v: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
}

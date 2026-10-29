import type { Json } from "@/lib/database.types";
import { addDaysISO, todayISO } from "@/lib/format";

export const PERIODOS = [
  { value: "semana", label: "Essa semana" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
] as const;
export type Periodo = (typeof PERIODOS)[number]["value"];

export function periodoValido(v: string | undefined): Periodo {
  return PERIODOS.some((p) => p.value === v) ? (v as Periodo) : "semana";
}

/** Início e fim do período (inclusive) e o período anterior de mesmo tamanho. */
export function intervalo(p: Periodo, hoje = todayISO()) {
  let inicio: string;
  if (p === "semana") {
    const dow = new Date(`${hoje}T12:00:00Z`).getUTCDay(); // 0 = domingo
    inicio = addDaysISO(hoje, -((dow + 6) % 7)); // segunda-feira
  } else {
    inicio = addDaysISO(hoje, -(Number(p) - 1));
  }
  const dias = Math.round((Date.parse(`${hoje}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86_400_000) + 1;
  return {
    inicio,
    fim: hoje,
    dias,
    anteriorInicio: addDaysISO(inicio, -dias),
    anteriorFim: addDaysISO(inicio, -1),
  };
}

type Barra = { inicio: string; fim: string; valor: number };

/** Converte o resumo calculado no banco (função dashboard_resumo) para números. */
export function lerResumo(json: Json | null) {
  const o = (json && typeof json === "object" && !Array.isArray(json) ? json : {}) as Record<string, Json | undefined>;
  const n = (k: string) => Number(o[k] ?? 0);
  const barras = (Array.isArray(o.barras) ? o.barras : []).map((b) => {
    const x = (b ?? {}) as Record<string, Json>;
    return { inicio: String(x.inicio), fim: String(x.fim), valor: Number(x.valor ?? 0) } satisfies Barra;
  });
  return {
    realizados: n("realizados"),
    realizadosAntes: n("realizadosAntes"),
    recebido: n("recebido"),
    recebidoAntes: n("recebidoAntes"),
    aReceber: n("aReceber"),
    aReceberQtd: n("aReceberQtd"),
    emAberto: n("emAberto"),
    pendentes: n("pendentes"),
    barras,
  };
}

/** Variação percentual; null quando não há base de comparação. */
export function variacao(atual: number, antes: number) {
  if (antes <= 0) return null;
  const pct = Math.round(((atual - antes) / antes) * 100);
  return { value: `${Math.abs(pct)}%`, direction: pct >= 0 ? ("up" as const) : ("down" as const) };
}

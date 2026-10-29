import type { Enums } from "@/lib/database.types";
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

export type OsDash = {
  status: Enums<"os_status">;
  data_inicio: string;
  data_entrega: string | null;
  valor_total: number;
  valor_recebido: number | null;
  recebido: boolean;
  data_recebimento: string | null;
};

const dentro = (d: string | null, a: string, b: string) => Boolean(d && d >= a && d <= b);

/** Data em que o dinheiro entrou (ou vai entrar). */
export function dataReceb(o: OsDash) {
  return o.data_recebimento ?? o.data_entrega ?? o.data_inicio;
}

export function metricas(oss: OsDash[], p: Periodo, hojeISO = todayISO()) {
  const r = intervalo(p, hojeISO);
  const hoje = r.fim;
  const concluidas = (a: string, b: string) =>
    oss.filter((o) => (o.status === "finalizado" || o.status === "aguardando_pagamento") && dentro(o.data_entrega, a, b)).length;
  const recebido = (a: string, b: string) =>
    oss
      .filter((o) => o.recebido && dataReceb(o) <= hoje && dentro(dataReceb(o), a, b))
      .reduce((s, o) => s + Number(o.valor_recebido ?? o.valor_total), 0);

  const aReceberLista = oss.filter((o) => o.status === "aguardando_pagamento");
  const aReceber = aReceberLista.reduce((s, o) => {
    if (o.recebido && dataReceb(o) > hoje) return s + Number(o.valor_recebido ?? o.valor_total);
    if (o.recebido) return s + Math.max(0, o.valor_total - Number(o.valor_recebido ?? o.valor_total));
    return s + o.valor_total;
  }, 0);

  // Ganhos por dia (ou por semana, no período de 90 dias).
  const porSemana = r.dias > 31;
  const passo = porSemana ? 7 : 1;
  const barras: { inicio: string; fim: string; valor: number }[] = [];
  for (let d = r.inicio; d <= r.fim; d = addDaysISO(d, passo)) {
    const fim = porSemana ? (addDaysISO(d, 6) < r.fim ? addDaysISO(d, 6) : r.fim) : d;
    barras.push({ inicio: d, fim, valor: recebido(d, fim) });
  }

  return {
    r,
    realizados: concluidas(r.inicio, r.fim),
    realizadosAntes: concluidas(r.anteriorInicio, r.anteriorFim),
    recebido: recebido(r.inicio, r.fim),
    recebidoAntes: recebido(r.anteriorInicio, r.anteriorFim),
    aReceber,
    aReceberQtd: aReceberLista.length,
    emAberto: oss.filter((o) => o.status === "em_andamento" || o.status === "pendente" || o.status === "retorno").length,
    pendentes: oss.filter((o) => o.status === "pendente").length,
    barras,
    porSemana,
  };
}

/** Variação percentual; null quando não há base de comparação. */
export function variacao(atual: number, antes: number) {
  if (antes <= 0) return null;
  const pct = Math.round(((atual - antes) / antes) * 100);
  return { value: `${Math.abs(pct)}%`, direction: pct >= 0 ? ("up" as const) : ("down" as const) };
}

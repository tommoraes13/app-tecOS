import type { Enums } from "@/lib/database.types";
import { pageTitle } from "@/i18n/server";
import { normalize } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ServicosList, type Filtros, type OsLinha } from "./servicos-list";

/** Quantas OS aparecem por página (precisa ficar aqui: valores de arquivos "use client" não chegam ao servidor). */
const POR_PAGINA = 10;

export const generateMetadata = pageTitle("Atendimentos");

const STATUS: Enums<"os_status">[] = ["em_andamento", "pendente", "aguardando_pagamento", "finalizado", "retorno"];
const dataOk = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; q?: string; de?: string; ate?: string; cat?: string; pagina?: string; ver?: string }>;
}) {
  const sp = await searchParams;
  const filtros: Filtros = {
    aba: STATUS.includes(sp.aba as Enums<"os_status">) ? (sp.aba as Enums<"os_status">) : "todos",
    q: (sp.q ?? "").slice(0, 80),
    de: dataOk(sp.de),
    ate: dataOk(sp.ate),
    cat: (sp.cat ?? "").replace(/[^a-z_]/g, ""),
  };
  const pagina = Math.max(1, Math.floor(Number(sp.pagina) || 1));

  // Busca sem acento: a coluna "busca" já vem minúscula e sem acento do banco.
  const termo = normalize(filtros.q).replace(/[,()*%\\"'.:]/g, " ").replace(/\s+/g, " ").trim();
  const numero = /^\d{1,5}$/.test(filtros.q.trim()) ? Number(filtros.q.trim()) : null;

  const supabase = await createClient();
  let lista = supabase
    .from("os_lista")
    .select("id, numero, status, data_inicio, valor_total, cliente, relato, servicos", { count: "exact" });
  if (filtros.aba !== "todos") lista = lista.eq("status", filtros.aba);
  if (filtros.de) lista = lista.gte("data_inicio", filtros.de);
  if (filtros.ate) lista = lista.lte("data_inicio", filtros.ate);
  if (filtros.cat) lista = lista.contains("categorias", [filtros.cat]);
  if (termo) lista = lista.or(numero !== null ? `busca.ilike.*${termo}*,numero.eq.${numero}` : `busca.ilike.*${termo}*`);

  const inicio = (pagina - 1) * POR_PAGINA;
  const [res, cont, rec] = await Promise.all([
    lista
      .order("data_inicio", { ascending: false })
      .order("numero", { ascending: false })
      .range(inicio, inicio + POR_PAGINA - 1),
    supabase.rpc("os_contagens", {
      p_busca: termo || undefined,
      p_numero: numero ?? undefined,
      p_de: filtros.de || undefined,
      p_ate: filtros.ate || undefined,
      p_categoria: filtros.cat || undefined,
    }),
    supabase
      .from("os_lista")
      .select("id, numero, status, data_inicio, valor_total, cliente, relato, servicos")
      .order("data_inicio", { ascending: false })
      .order("numero", { ascending: false })
      .limit(5),
  ]);

  const paraLinha = (o: {
    id: string | null;
    numero: number | null;
    status: Enums<"os_status"> | null;
    data_inicio: string | null;
    valor_total: number | null;
    cliente: string | null;
    relato: string | null;
    servicos: string[] | null;
  }): OsLinha[] =>
    o.id && o.status && o.data_inicio
      ? [
          {
            id: o.id,
            numero: o.numero ?? 0,
            status: o.status,
            data_inicio: o.data_inicio,
            valor_total: o.valor_total ?? 0,
            cliente: o.cliente,
            relato: o.relato,
            servicos: o.servicos ?? [],
          },
        ]
      : [];

  const contagens = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<Enums<"os_status">, number>;
  for (const c of cont.data ?? []) contagens[c.status] = c.qtd;

  return (
    <ServicosList
      linhas={(res.data ?? []).flatMap(paraLinha)}
      recentes={(rec.data ?? []).flatMap(paraLinha)}
      contagens={contagens}
      totalFiltrado={res.count ?? 0}
      pagina={pagina}
      filtros={filtros}
      algumaOs={(rec.data ?? []).length > 0}
      porPagina={POR_PAGINA}
      verId={sp.ver && /^[0-9a-f-]{36}$/.test(sp.ver) ? sp.ver : null}
    />
  );
}

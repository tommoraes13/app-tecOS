import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums } from "@/lib/database.types";

export type VisitaAgenda = {
  id: string;
  os_id: string;
  data: string;
  hora: string | null;
  duracao_min: number | null;
  numero: number;
  status: Enums<"os_status">;
  cliente: string | null;
  bairro: string | null;
  cidade: string | null;
};

/** Visitas técnicas entre duas datas (inclusive), com o número da OS e o cliente. */
export async function carregarVisitas(
  supabase: SupabaseClient<Database>,
  de: string,
  ate: string,
  limite = 500,
): Promise<VisitaAgenda[]> {
  const { data: visitas } = await supabase
    .from("os_visitas")
    .select("id, os_id, data, hora, duracao_min")
    .gte("data", de)
    .lte("data", ate)
    .order("data")
    .order("hora", { nullsFirst: false })
    .limit(limite);
  const lista = visitas ?? [];
  if (lista.length === 0) return [];

  const osIds = [...new Set(lista.map((v) => v.os_id))];
  const { data: oss } = await supabase.from("base_atendimentos").select("id, numero, status, cliente_id").in("id", osIds);
  const clienteIds = [...new Set((oss ?? []).map((o) => o.cliente_id).filter((x): x is string => Boolean(x)))];
  const { data: clientes } = clienteIds.length
    ? await supabase.from("base_clientes").select("id, nome, bairro, cidade").in("id", clienteIds)
    : { data: [] as { id: string; nome: string; bairro: string | null; cidade: string | null }[] };

  const osMap = new Map((oss ?? []).map((o) => [o.id, o]));
  const clMap = new Map((clientes ?? []).map((c) => [c.id, c]));

  return lista.flatMap((v) => {
    const os = osMap.get(v.os_id);
    if (!os) return [];
    const c = os.cliente_id ? clMap.get(os.cliente_id) : undefined;
    return [
      {
        id: v.id,
        os_id: v.os_id,
        data: v.data,
        hora: v.hora ? v.hora.slice(0, 5) : null,
        duracao_min: v.duracao_min,
        numero: os.numero,
        status: os.status,
        cliente: c?.nome ?? null,
        bairro: c?.bairro ?? null,
        cidade: c?.cidade ?? null,
      },
    ];
  });
}

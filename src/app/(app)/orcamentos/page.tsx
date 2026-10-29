import { createClient } from "@/lib/supabase/server";
import { OrcamentosList, type OrcamentoLinha } from "./orcamentos-list";
import { pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Orçamentos");

export default async function OrcamentosPage() {
  const supabase = await createClient();
  const [orc, cl, os] = await Promise.all([
    supabase
      .from("base_orcamentos")
      .select("id, numero, data, valor_total, cliente_id, relato")
      .order("data", { ascending: false })
      .order("numero", { ascending: false })
      .limit(1000),
    supabase.from("base_clientes").select("id, nome, telefone"),
    supabase.from("base_atendimentos").select("id, numero, orcamento_id").not("orcamento_id", "is", null),
  ]);
  const clientes = new Map((cl.data ?? []).map((c) => [c.id, c]));
  const geradas = new Map((os.data ?? []).map((o) => [o.orcamento_id, o]));
  const linhas: OrcamentoLinha[] = (orc.data ?? []).map((o) => {
    const c = o.cliente_id ? clientes.get(o.cliente_id) : undefined;
    const g = geradas.get(o.id);
    return {
      id: o.id,
      numero: o.numero,
      data: o.data,
      valor_total: o.valor_total,
      relato: o.relato,
      cliente: c?.nome ?? null,
      telefone: c?.telefone ?? null,
      os: g ? { id: g.id, numero: g.numero } : null,
    };
  });
  return <OrcamentosList linhas={linhas} />;
}

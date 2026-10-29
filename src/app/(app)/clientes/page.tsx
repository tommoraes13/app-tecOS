import type { Metadata } from "next";
import { getI18n, pageTitle } from "@/i18n/server";
import { addMonthsISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ClientesList, type ResumoClientes } from "./clientes-list";

export const generateMetadata: () => Promise<Metadata> = pageTitle("Clientes");

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ abrir?: string }> }) {
  const { abrir } = await searchParams;
  const supabase = await createClient();
  const [cl, os, orc] = await Promise.all([
    supabase.from("clientes_resumo").select("*").order("nome"),
    supabase.from("base_atendimentos").select("cliente_id, valor_total, data_entrega, garantia_meses, orcamento_id").limit(5000),
    supabase.from("base_orcamentos").select("id").limit(5000),
  ]);

  const hoje = (await getI18n()).fmt.today();
  const oss = os.data ?? [];
  const emGarantia = new Set<string>();
  for (const o of oss) {
    if (o.cliente_id && o.data_entrega && o.garantia_meses && addMonthsISO(o.data_entrega, o.garantia_meses) >= hoje) {
      emGarantia.add(o.cliente_id);
    }
  }
  const totalOrc = orc.data?.length ?? 0;
  const aceitos = oss.filter((o) => o.orcamento_id).length;

  const resumo: ResumoClientes = {
    clientes: cl.data?.length ?? 0,
    valorMedio: oss.length ? oss.reduce((s, o) => s + Number(o.valor_total), 0) / oss.length : 0,
    emGarantia: emGarantia.size,
    orcamentos: totalOrc,
    aceitos,
  };

  return <ClientesList clientes={cl.data ?? []} abrirId={abrir ?? null} resumo={resumo} emGarantia={[...emGarantia]} />;
}

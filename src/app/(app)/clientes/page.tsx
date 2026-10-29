import type { Metadata } from "next";
import { getI18n, pageTitle } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { ClientesList, type ResumoClientes } from "./clientes-list";

export const generateMetadata: () => Promise<Metadata> = pageTitle("Clientes");

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ abrir?: string }> }) {
  const { abrir } = await searchParams;
  const supabase = await createClient();
  const { fmt } = await getI18n();
  // A faixa de resumo vem calculada do banco (não baixa todas as OS).
  const [cl, res] = await Promise.all([
    supabase.from("clientes_resumo").select("*").order("nome"),
    supabase.rpc("clientes_resumo_geral", { p_hoje: fmt.today() }),
  ]);

  const r = (res.data && typeof res.data === "object" && !Array.isArray(res.data) ? res.data : {}) as {
    valorMedio?: number;
    emGarantia?: string[];
    orcamentos?: number;
    aceitos?: number;
  };
  const emGarantia = r.emGarantia ?? [];
  const resumo: ResumoClientes = {
    clientes: cl.data?.length ?? 0,
    valorMedio: Number(r.valorMedio ?? 0),
    emGarantia: emGarantia.length,
    orcamentos: Number(r.orcamentos ?? 0),
    aceitos: Number(r.aceitos ?? 0),
  };

  return <ClientesList clientes={cl.data ?? []} abrirId={abrir ?? null} resumo={resumo} emGarantia={emGarantia} />;
}

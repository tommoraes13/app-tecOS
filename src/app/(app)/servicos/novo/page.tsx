import { DocumentoForm } from "@/components/documento/documento-form";
import { carregarApoio, formularioVazio } from "@/lib/documento-server";
import { createClient } from "@/lib/supabase/server";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Novo atendimento");

export default async function NovoAtendimentoPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const [apoio, { fmt }] = await Promise.all([carregarApoio(supabase, cliente ?? null), getI18n()]);
  const clienteId = cliente && apoio.clientes.some((c) => c.id === cliente) ? cliente : null;
  return (
    <DocumentoForm
      mode="os"
      initial={formularioVazio(apoio.proximaOS, apoio.padroes, clienteId, fmt.today())}
      clientes={apoio.clientes}
      servicos={apoio.servicos}
      produtos={apoio.produtos}
      padroes={apoio.padroes}
    />
  );
}

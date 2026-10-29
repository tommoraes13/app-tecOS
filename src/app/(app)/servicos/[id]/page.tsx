import { notFound } from "next/navigation";
import { DocumentoForm } from "@/components/documento/documento-form";
import { aplicarTempos, carregarApoio, comCliente, carregarAtendimento } from "@/lib/documento-server";
import { createClient } from "@/lib/supabase/server";
import { pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Atendimento");

export default async function AtendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [apoio, os] = await Promise.all([carregarApoio(supabase), carregarAtendimento(supabase, id)]);
  if (!os) notFound();
  const clientes = await comCliente(supabase, apoio.clientes, os.form.cliente_id);
  return (
    <DocumentoForm
      mode="os"
      initial={aplicarTempos(os.form, apoio.servicos)}
      clientes={clientes}
      servicos={apoio.servicos}
      produtos={apoio.produtos}
      padroes={apoio.padroes}
      orcamentoOrigem={os.orcamentoOrigem}
    />
  );
}

import { notFound } from "next/navigation";
import { DocumentoForm } from "@/components/documento/documento-form";
import { aplicarTempos, carregarApoio, carregarOrcamento } from "@/lib/documento-server";
import { createClient } from "@/lib/supabase/server";
import { pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Orçamento");

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [apoio, orc] = await Promise.all([carregarApoio(supabase), carregarOrcamento(supabase, id)]);
  if (!orc) notFound();
  return (
    <DocumentoForm
      mode="orcamento"
      initial={aplicarTempos(orc.form, apoio.servicos)}
      clientes={apoio.clientes}
      servicos={apoio.servicos}
      produtos={apoio.produtos}
      padroes={apoio.padroes}
      osGerada={orc.osGerada}
    />
  );
}

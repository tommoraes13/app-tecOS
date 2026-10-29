import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentoForm } from "@/components/documento/documento-form";
import { carregarApoio, carregarOrcamento } from "@/lib/documento-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orçamento" };

export default async function OrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const apoio = await carregarApoio(supabase);
  const orc = await carregarOrcamento(supabase, id, apoio.servicos, apoio.padroes);
  if (!orc) notFound();
  return (
    <DocumentoForm
      mode="orcamento"
      initial={orc.form}
      clientes={apoio.clientes}
      servicos={apoio.servicos}
      produtos={apoio.produtos}
      padroes={apoio.padroes}
      osGerada={orc.osGerada}
    />
  );
}

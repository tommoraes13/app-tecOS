import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentoForm } from "@/components/documento/documento-form";
import { aplicarTempos, carregarApoio, carregarAtendimento } from "@/lib/documento-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Atendimento" };

export default async function AtendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [apoio, os] = await Promise.all([carregarApoio(supabase), carregarAtendimento(supabase, id)]);
  if (!os) notFound();
  return (
    <DocumentoForm
      mode="os"
      initial={aplicarTempos(os.form, apoio.servicos)}
      clientes={apoio.clientes}
      servicos={apoio.servicos}
      produtos={apoio.produtos}
      padroes={apoio.padroes}
      orcamentoOrigem={os.orcamentoOrigem}
    />
  );
}

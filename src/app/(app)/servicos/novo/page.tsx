import type { Metadata } from "next";
import { DocumentoForm } from "@/components/documento/documento-form";
import { carregarApoio, formularioVazio } from "@/lib/documento-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Novo atendimento" };

export default async function NovoAtendimentoPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const apoio = await carregarApoio(supabase);
  const clienteId = cliente && apoio.clientes.some((c) => c.id === cliente) ? cliente : null;
  return (
    <DocumentoForm
      mode="os"
      initial={formularioVazio(apoio.proximaOS, apoio.padroes, clienteId)}
      clientes={apoio.clientes}
      servicos={apoio.servicos}
      produtos={apoio.produtos}
      padroes={apoio.padroes}
    />
  );
}

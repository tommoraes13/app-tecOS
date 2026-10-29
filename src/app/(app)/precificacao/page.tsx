import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { PrecificacaoForm } from "./precificacao-form";

export const metadata: Metadata = { title: "Precificação" };

export default async function PrecificacaoPage() {
  const supabase = await createClient();
  const { data: negocio } = await supabase.from("meu_negocio").select("*").maybeSingle();
  return (
    <>
      <PageHeader title="Precificação" description="Valores padrão de visita e deslocamento dos seus atendimentos." />
      {negocio ? <PrecificacaoForm negocio={negocio} /> : null}
    </>
  );
}

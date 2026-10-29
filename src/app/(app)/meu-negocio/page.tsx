import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { EmpresaForm } from "./empresa-form";

export const metadata: Metadata = { title: "Meu Negócio" };

export default async function MeuNegocioPage() {
  const supabase = await createClient();
  const { data: negocio } = await supabase.from("meu_negocio").select("*").maybeSingle();
  return (
    <>
      <PageHeader title="Meu Negócio" description="Dados da empresa que saem nos PDFs e a garantia padrão." />
      {negocio ? (
        <EmpresaForm negocio={negocio} />
      ) : (
        <p className="rounded-xl bg-surface p-6 text-sm text-ink-muted shadow-card">
          Não encontramos os dados do seu negócio. Saia e entre de novo; se continuar, avise o suporte.
        </p>
      )}
    </>
  );
}

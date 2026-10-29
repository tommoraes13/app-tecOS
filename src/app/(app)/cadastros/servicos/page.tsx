import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { CatalogoServicos } from "./catalogo-servicos";

export const metadata: Metadata = { title: "Cadastro de Serviços" };

export default async function CadastroServicosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cadastro_servicos").select("*").order("nome");
  return (
    <>
      <PageHeader
        title="Cadastro de Serviços"
        description="Os serviços que você mais faz, com valor e tempo médio. Aparecem para escolher na OS e no orçamento."
      />
      <CatalogoServicos servicos={data ?? []} />
    </>
  );
}

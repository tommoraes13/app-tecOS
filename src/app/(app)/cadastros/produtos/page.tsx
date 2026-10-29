import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { CatalogoProdutos } from "./catalogo-produtos";

export const metadata: Metadata = { title: "Cadastro de Produtos" };

export default async function CadastroProdutosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("cadastro_produtos").select("*").order("nome");
  return (
    <>
      <PageHeader
        title="Cadastro de Produtos"
        description="Peças e itens que você vende, com custo e preço de venda. Aparecem para escolher na OS e no orçamento."
      />
      <CatalogoProdutos produtos={data ?? []} />
    </>
  );
}

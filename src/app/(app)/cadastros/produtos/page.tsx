import { Package } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { CatalogoProdutos } from "./catalogo-produtos";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Cadastro de Produtos");

export default async function CadastroProdutosPage({ searchParams }: { searchParams: Promise<{ abrir?: string }> }) {
  const { abrir } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { t }] = await Promise.all([supabase.from("cadastro_produtos").select("*").order("nome"), getI18n()]);
  return (
    <>
      <PageHeader
        icon={Package}
        title={t("Cadastro de Produtos")}
      />
      <CatalogoProdutos key={abrir ?? ""} produtos={data ?? []} abrirId={abrir ?? null} />
    </>
  );
}

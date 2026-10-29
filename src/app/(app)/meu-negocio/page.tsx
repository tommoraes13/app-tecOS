import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LinkTabs } from "@/components/ui/link-tabs";
import { createClient } from "@/lib/supabase/server";
import { EmpresaForm } from "./empresa-form";
import { PrecificacaoForm } from "./precificacao-form";
import { CatalogoServicos } from "./catalogo-servicos";
import { CatalogoProdutos } from "./catalogo-produtos";

export const metadata: Metadata = { title: "Meu Negócio" };

const ABAS = ["empresa", "precificacao", "servicos", "produtos"] as const;
type Aba = (typeof ABAS)[number];

export default async function MeuNegocioPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba: abaParam } = await searchParams;
  const aba: Aba = ABAS.includes(abaParam as Aba) ? (abaParam as Aba) : "empresa";

  const supabase = await createClient();
  const [{ data: negocio }, { data: servicos }, { data: produtos }] = await Promise.all([
    supabase.from("meu_negocio").select("*").maybeSingle(),
    supabase.from("cadastro_servicos").select("*").order("nome"),
    supabase.from("cadastro_produtos").select("*").order("nome"),
  ]);

  return (
    <>
      <PageHeader
        title="Meu Negócio"
        description="Dados que saem nos PDFs, valores padrão dos atendimentos e seus catálogos."
      />
      <LinkTabs
        active={aba}
        className="mb-6"
        items={[
          { value: "empresa", label: "Dados da empresa", href: "/meu-negocio" },
          { value: "precificacao", label: "Precificação", href: "/meu-negocio?aba=precificacao" },
          { value: "servicos", label: "Serviços", href: "/meu-negocio?aba=servicos", count: servicos?.length ?? 0 },
          { value: "produtos", label: "Produtos", href: "/meu-negocio?aba=produtos", count: produtos?.length ?? 0 },
        ]}
      />

      {!negocio && (aba === "empresa" || aba === "precificacao") ? (
        <p className="rounded-xl bg-surface p-6 text-sm text-ink-muted shadow-card">
          Não encontramos os dados do seu negócio. Saia e entre de novo; se continuar, avise o suporte.
        </p>
      ) : null}

      {negocio && aba === "empresa" ? <EmpresaForm negocio={negocio} /> : null}
      {negocio && aba === "precificacao" ? <PrecificacaoForm negocio={negocio} /> : null}
      {aba === "servicos" ? <CatalogoServicos servicos={servicos ?? []} /> : null}
      {aba === "produtos" ? <CatalogoProdutos produtos={produtos ?? []} /> : null}
    </>
  );
}

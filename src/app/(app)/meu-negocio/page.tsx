import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { EmpresaForm } from "./empresa-form";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Meu Negócio");

export default async function MeuNegocioPage() {
  const supabase = await createClient();
  const [{ data: negocio }, { t }] = await Promise.all([supabase.from("meu_negocio").select("*").maybeSingle(), getI18n()]);
  return (
    <>
      <PageHeader title={t("Meu Negócio")} description={t("Dados da empresa que saem nos PDFs e a garantia padrão.")} />
      {negocio ? (
        <EmpresaForm negocio={negocio} />
      ) : (
        <p className="rounded-xl bg-surface p-6 text-sm text-ink-muted shadow-card">
          {t("Não encontramos os dados do seu negócio. Saia e entre de novo; se continuar, avise o suporte.")}
        </p>
      )}
    </>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { PrecificacaoForm } from "./precificacao-form";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Precificação");

export default async function PrecificacaoPage() {
  const supabase = await createClient();
  const [{ data: negocio }, { t }] = await Promise.all([supabase.from("meu_negocio").select("*").maybeSingle(), getI18n()]);
  return (
    <>
      <PageHeader title={t("Precificação")} description={t("Valores padrão de visita e deslocamento dos seus atendimentos.")} />
      {negocio ? <PrecificacaoForm negocio={negocio} /> : null}
    </>
  );
}

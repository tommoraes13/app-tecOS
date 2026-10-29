import { Tags } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { PrecificacaoForm } from "./precificacao-form";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Tabela de Preços");

export default async function PrecificacaoPage() {
  const supabase = await createClient();
  const [{ data: negocio }, { t }] = await Promise.all([supabase.from("meu_negocio").select("*").maybeSingle(), getI18n()]);
  return (
    <>
      <PageHeader icon={Tags} title={t("Tabela de Preços")} description={t("Valores padrão de visita e deslocamento dos seus atendimentos.")} />
      {negocio ? <PrecificacaoForm negocio={negocio} /> : null}
    </>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { CatalogoServicos } from "./catalogo-servicos";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Cadastro de Serviços");

export default async function CadastroServicosPage() {
  const supabase = await createClient();
  const [{ data }, { t }] = await Promise.all([supabase.from("cadastro_servicos").select("*").order("nome"), getI18n()]);
  return (
    <>
      <PageHeader
        title={t("Cadastro de Serviços")}
        description={t("Os serviços que você mais faz, com valor e tempo médio. Aparecem para escolher na OS e no orçamento.")}
      />
      <CatalogoServicos servicos={data ?? []} />
    </>
  );
}

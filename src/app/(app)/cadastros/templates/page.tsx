import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getI18n, pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Cadastro de Templates");

export default async function CadastroTemplatesPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader icon={ListChecks} title={t("Cadastro de Templates")} description={t("Checklists, sequências de atendimento e outros modelos.")} />
      <Card>
        <EmptyState
          icon={ListChecks}
          title={t("Em breve")}
          description={t("Aqui você vai cadastrar checklists e sequências para usar nos atendimentos.")}
        />
      </Card>
    </>
  );
}

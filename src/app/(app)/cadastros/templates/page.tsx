import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Cadastro de Templates" };

export default function CadastroTemplatesPage() {
  return (
    <>
      <PageHeader title="Cadastro de Templates" description="Checklists, sequências de atendimento e outros modelos." />
      <Card>
        <EmptyState
          icon={ListChecks}
          title="Em breve"
          description="Aqui você vai cadastrar checklists e sequências para usar nos atendimentos."
        />
      </Card>
    </>
  );
}

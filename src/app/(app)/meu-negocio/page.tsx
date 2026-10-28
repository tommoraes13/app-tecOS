import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { PlaceholderScreen } from "../placeholder";

export const metadata: Metadata = { title: "Meu Negócio" };

export default function Page() {
  return (
    <PlaceholderScreen
      title="Meu Negócio"
      description="Dados da empresa, precificação e catálogos de serviços e produtos."
      icon={Briefcase}
      emptyTitle="Configuração em breve"
      emptyText="Aqui você vai cadastrar os dados que saem no PDF, o valor da visita e seus serviços e produtos."
    />
  );
}

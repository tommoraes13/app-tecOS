import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { PlaceholderScreen } from "../placeholder";

export const metadata: Metadata = { title: "Serviços Prestados" };

export default function Page() {
  return (
    <PlaceholderScreen
      title="Serviços Prestados"
      description="Seus atendimentos, do mais recente ao mais antigo."
      icon={Wrench}
      emptyTitle="Nenhum atendimento ainda"
      emptyText="Cada ordem de serviço criada aparece aqui, com filtros de data, tipo e status."
      cta="Novo atendimento"
    />
  );
}

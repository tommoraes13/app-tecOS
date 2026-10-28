import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PlaceholderScreen } from "../placeholder";

export const metadata: Metadata = { title: "Orçamentos" };

export default function Page() {
  return (
    <PlaceholderScreen
      title="Orçamentos"
      description="Orçamentos enviados e aguardando aceite."
      icon={FileText}
      emptyTitle="Nenhum orçamento ainda"
      emptyText="Crie um orçamento e, quando o cliente aprovar, transforme em atendimento com um clique."
      cta="Novo orçamento"
    />
  );
}

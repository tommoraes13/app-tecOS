import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PlaceholderScreen } from "../placeholder";

export const metadata: Metadata = { title: "Minha Agenda" };

export default function Page() {
  return (
    <PlaceholderScreen
      title="Minha Agenda"
      description="Próximos atendimentos e calendário."
      icon={CalendarDays}
      emptyTitle="Nenhuma visita agendada"
      emptyText="As visitas técnicas das suas OS aparecem aqui, em lista e no calendário."
      cta="Novo atendimento"
    />
  );
}

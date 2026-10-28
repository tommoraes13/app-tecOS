import type { Metadata } from "next";
import { CircleUser } from "lucide-react";
import { PlaceholderScreen } from "../placeholder";

export const metadata: Metadata = { title: "Minha Conta" };

export default function Page() {
  return (
    <PlaceholderScreen
      title="Minha Conta"
      description="Plano, senha e preferências."
      icon={CircleUser}
      emptyTitle="Configuração em breve"
      emptyText="Plano, troca de senha e tema claro/escuro ficam aqui. O tema já pode ser trocado no menu."
    />
  );
}

import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PlaceholderScreen } from "../placeholder";

export const metadata: Metadata = { title: "Clientes" };

export default function Page() {
  return (
    <PlaceholderScreen
      title="Clientes"
      description="Seus clientes e os equipamentos de cada um."
      icon={Users}
      emptyTitle="Nenhum cliente cadastrado"
      emptyText="Cadastre clientes aqui ou direto na criação de uma OS."
      cta="Novo cliente"
    />
  );
}

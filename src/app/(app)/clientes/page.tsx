import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClientesList } from "./clientes-list";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ abrir?: string }> }) {
  const { abrir } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("clientes_resumo").select("*").order("nome");
  return <ClientesList clientes={data ?? []} abrirId={abrir ?? null} />;
}

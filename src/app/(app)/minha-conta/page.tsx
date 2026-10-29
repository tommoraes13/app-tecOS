import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { getPerfil } from "@/lib/perfil";
import { ContaForms } from "./conta-forms";
import { PerfilForm } from "./perfil-form";

export const metadata: Metadata = { title: "Minha Conta" };

export default async function MinhaContaPage() {
  const perfil = await getPerfil();
  if (!perfil) return null;
  return (
    <>
      <PageHeader title="Minha Conta" description={perfil.email ?? ""} />
      <div className="grid max-w-[720px] gap-6">
        <PerfilForm perfil={perfil} />
        <ContaForms />
      </div>
    </>
  );
}

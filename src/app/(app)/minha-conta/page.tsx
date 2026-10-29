import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { getI18n } from "@/i18n/server";
import { getPerfil } from "@/lib/perfil";
import { ContaForms } from "./conta-forms";
import { PerfilForm } from "./perfil-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Minha Conta") };
}

export default async function MinhaContaPage() {
  const [perfil, { t }] = await Promise.all([getPerfil(), getI18n()]);
  if (!perfil) return null;
  return (
    <>
      <PageHeader icon={UserRound} title={t("Minha Conta")} description={perfil.email ?? ""} />
      <div className="grid max-w-[720px] gap-6">
        <PerfilForm perfil={perfil} />
        <ContaForms />
      </div>
    </>
  );
}

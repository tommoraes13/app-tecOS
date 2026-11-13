import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { VoltarMobile } from "@/components/layout/voltar-mobile";
import { LinkTabs } from "@/components/ui/link-tabs";
import { getI18n } from "@/i18n/server";
import { getPerfil } from "@/lib/perfil";
import { Aparencia, TrocarSenha } from "./conta-forms";
import { PerfilForm } from "./perfil-form";
import { PlanoCard } from "./plano-card";
import { Sair24hForm } from "./sair-24h-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Minha Conta") };
}

const ABAS = ["conta", "aparencia", "plano", "dados"] as const;
type Aba = (typeof ABAS)[number];

export default async function MinhaContaPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const [perfil, { t }, { aba: abaParam }] = await Promise.all([getPerfil(), getI18n(), searchParams]);
  if (!perfil) return null;
  const aba: Aba = ABAS.includes(abaParam as Aba) ? (abaParam as Aba) : "conta";
  return (
    <>
      <PageHeader icon={UserRound} title={t("Minha Conta")} />
      <LinkTabs
        className="mb-5"
        active={aba}
        items={[
          { value: "conta", label: t("Minha conta"), href: "/minha-conta" },
          { value: "aparencia", label: t("Aparência"), href: "/minha-conta?aba=aparencia" },
          { value: "plano", label: t("Meu Plano"), href: "/minha-conta?aba=plano" },
          { value: "dados", label: t("Alterar dados"), href: "/minha-conta?aba=dados" },
        ]}
      />
      <div className="grid max-w-[720px] gap-6">
        {aba === "conta" ? (
          <>
            <PerfilForm perfil={perfil} />
            <Sair24hForm ligado={perfil.sairApos24h} />
          </>
        ) : null}
        {aba === "aparencia" ? <Aparencia /> : null}
        {aba === "plano" ? <PlanoCard t={t} /> : null}
        {aba === "dados" ? <TrocarSenha /> : null}
        <VoltarMobile />
      </div>
    </>
  );
}

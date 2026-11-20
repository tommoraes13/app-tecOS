import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/layout/wordmark";
import { getI18n } from "@/i18n/server";
import { metodoValido } from "@/lib/documento";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { PrimeiroAcessoWizard } from "./primeiro-acesso-wizard";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Primeiro acesso") };
}

/** Passo a passo da conta nova: dados, senha, negócio, endereço e preços. */
export default async function PrimeiroAcessoPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login");
  if (!perfil.primeiroAcesso) redirect("/dashboard");
  const supabase = await createClient();
  const { data: n } = await supabase.from("meu_negocio").select("*").maybeSingle();
  return (
    <main className="grid min-h-dvh place-items-start px-4 pt-[max(32px,env(safe-area-inset-top))] pb-[max(32px,calc(env(safe-area-inset-bottom)+16px))] sm:place-items-center">
      <div className="mx-auto w-full max-w-[520px]">
        <Wordmark className="mb-6 justify-center text-2xl" />
        <PrimeiroAcessoWizard
          email={perfil.email ?? ""}
          inicial={{
            nome: perfil.nome ?? "",
            celular: perfil.telefone ?? "",
            negocio: n?.nome_fantasia ?? "",
            telefone_negocio: n?.telefone ?? "",
            cpf_cnpj: n?.cpf_cnpj ?? "",
            cep: n?.cep ?? "",
            endereco: n?.endereco ?? "",
            numero: n?.numero ?? "",
            complemento: n?.complemento ?? "",
            bairro: n?.bairro ?? "",
            cidade: n?.cidade ?? "",
            estado: n?.estado ?? "",
            tipo_precificacao: metodoValido(n?.tipo_precificacao),
            valor_visita: Number(n?.valor_visita ?? 0),
            valor_hora: Number(n?.valor_hora ?? 0),
          }}
        />
      </div>
    </main>
  );
}

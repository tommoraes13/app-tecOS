import type { Metadata } from "next";
import { Wordmark } from "@/components/layout/wordmark";
import { getI18n } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { DefinirSenhaForm } from "./definir-senha-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Primeiro acesso") };
}

/** Quem foi convidado pelo dono do app chega aqui para criar a senha e se apresentar. */
export default async function DefinirSenhaPage() {
  const supabase = await createClient();
  const [{ data: perfil }, { data: negocio }] = await Promise.all([
    supabase.from("perfil").select("nome_exibicao").maybeSingle(),
    supabase.from("meu_negocio").select("nome_fantasia, telefone").maybeSingle(),
  ]);
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <Wordmark className="mb-8 justify-center text-2xl" />
        <div className="rounded-xl bg-surface p-6 shadow-card sm:p-8">
          <DefinirSenhaForm
            inicial={{
              nome: perfil?.nome_exibicao ?? "",
              negocio: negocio?.nome_fantasia ?? "",
              telefone: negocio?.telefone ?? "",
            }}
          />
        </div>
      </div>
    </main>
  );
}

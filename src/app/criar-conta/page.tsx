import type { Metadata } from "next";
import { LanguageSelect } from "@/components/layout/language-select";
import { Wordmark } from "@/components/layout/wordmark";
import { getI18n } from "@/i18n/server";
import { CriarContaForm } from "./criar-conta-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Criar conta") };
}

export default async function CriarContaPage() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <Wordmark className="mb-8 justify-center text-2xl" />
        <div className="rounded-xl bg-surface p-6 shadow-card sm:p-8">
          <CriarContaForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-subtle">{t("Gestão de atendimentos para técnicos de informática.")}</p>
        <div className="mt-4 flex justify-center">
          <LanguageSelect />
        </div>
      </div>
    </main>
  );
}

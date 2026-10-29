import type { Metadata } from "next";
import { LanguageSelect } from "@/components/layout/language-select";
import { Wordmark } from "@/components/layout/wordmark";
import { getI18n } from "@/i18n/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Entrar") };
}

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <Wordmark className="mb-8 justify-center text-2xl" />
        <div className="rounded-xl bg-surface p-6 shadow-card sm:p-8">
          {hasSupabaseEnv ? (
            <LoginForm />
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-medium">{t("Supabase ainda não configurado")}</p>
              <p className="text-ink-muted">
                <code className="font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code> ·{" "}
                <code className="font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
              </p>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-subtle">{t("Gestão de atendimentos para técnicos de informática.")}</p>
        <div className="mt-4 flex justify-center">
          <LanguageSelect />
        </div>
      </div>
    </main>
  );
}

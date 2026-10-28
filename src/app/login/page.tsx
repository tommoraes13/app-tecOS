import type { Metadata } from "next";
import { Wordmark } from "@/components/layout/wordmark";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <Wordmark className="mb-8 justify-center text-2xl" />
        <div className="rounded-xl bg-surface p-6 shadow-card sm:p-8">
          {hasSupabaseEnv ? (
            <LoginForm />
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-medium">Supabase ainda não configurado</p>
              <p className="text-ink-muted">
                Cadastre <code className="font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                <code className="font-mono text-[13px]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> nas variáveis de
                ambiente da Vercel e publique de novo.
              </p>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-subtle">
          Gestão de atendimentos para técnicos de informática.
        </p>
      </div>
    </main>
  );
}

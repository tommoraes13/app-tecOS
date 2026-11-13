"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";

/** Mensagem do Supabase (em inglês) → texto em português, que depois passa pelo t(). */
function translateError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.";
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}

export function LoginForm({ expirou = false }: { expirou?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(expirou ? t("Você saiu sozinho depois de 24 horas. Entre de novo.") : null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(t(translateError(error.message)));
    router.replace("/dashboard");
    router.refresh();
  }

  async function esqueci() {
    setError(null);
    setNotice(null);
    if (!email.includes("@")) return setError(t("Digite seu e-mail acima para receber o link de troca de senha."));
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/minha-conta?aba=dados")}`,
    });
    setLoading(false);
    if (error) return setError(t("Não foi possível enviar agora. Tente de novo em instantes."));
    setNotice(t("Enviamos um link para o seu e-mail. Ao abrir, você entra e pode trocar a senha em Minha Conta."));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-lg leading-[26px] font-semibold">{t("Entrar")}</h1>

      <Field label={t("E-mail")} htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("voce@email.com")}
        />
      </Field>

      <Field label={t("Senha")} htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error ? <p className="rounded-md bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p> : null}
      {notice ? <p className="rounded-md bg-success-bg px-3 py-2 text-[13px] text-success">{notice}</p> : null}

      <Button type="submit" variant="dark" className="w-full" disabled={loading}>
        {loading ? t("Aguarde…") : t("Entrar")}
      </Button>

      <p className="text-center text-[13px]">
        <button type="button" onClick={esqueci} className="text-ink-muted hover:text-ink hover:underline">
          {t("Esqueci minha senha")}
        </button>
      </p>

      <div className="border-t border-border pt-4 text-center text-[13px] text-ink-muted">
        {t("Ainda não tem conta?")}{" "}
        <Link href="/criar-conta" className="font-medium text-brand-ink hover:underline">
          {t("Criar conta")}
        </Link>
      </div>
    </form>
  );
}

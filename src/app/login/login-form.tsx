"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";

type Mode = "entrar" | "criar";

/** Mensagem do Supabase (em inglês) → texto em português, que depois passa pelo t(). */
function translateError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.";
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail. Entre com sua senha.";
  if (m.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}

export function LoginForm() {
  const { t, prefs } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(t(translateError(error.message)));
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?idioma=${prefs.locale}` },
    });
    setLoading(false);
    if (error) return setError(t(translateError(error.message)));
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setNotice(t("Conta criada. Enviamos um link de confirmação para o seu e-mail."));
  }

  const isLogin = mode === "entrar";

  async function esqueci() {
    setError(null);
    setNotice(null);
    if (!email.includes("@")) return setError(t("Digite seu e-mail acima para receber o link de troca de senha."));
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/minha-conta`,
    });
    setLoading(false);
    if (error) return setError(t("Não foi possível enviar agora. Tente de novo em instantes."));
    setNotice(t("Enviamos um link para o seu e-mail. Ao abrir, você entra e pode trocar a senha em Minha Conta."));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg leading-[26px] font-semibold">{isLogin ? t("Entrar") : t("Criar conta")}</h1>
        <p className="text-[13px] leading-[18px] text-ink-subtle">
          {isLogin ? t("Acesse seus atendimentos.") : t("Comece a organizar seus atendimentos.")}
        </p>
      </div>

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

      <Field label={t("Senha")} htmlFor="password" hint={isLogin ? undefined : t("Mínimo de 6 caracteres")}>
        <Input
          id="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error ? <p className="rounded-md bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p> : null}
      {notice ? <p className="rounded-md bg-success-bg px-3 py-2 text-[13px] text-success">{notice}</p> : null}

      <Button type="submit" variant="dark" className="w-full" disabled={loading}>
        {loading ? t("Aguarde…") : isLogin ? t("Entrar") : t("Criar conta")}
      </Button>

      {isLogin ? (
        <p className="text-center text-[13px]">
          <button type="button" onClick={esqueci} className="text-ink-muted hover:text-ink hover:underline">
            {t("Esqueci minha senha")}
          </button>
        </p>
      ) : null}

      <p className="text-center text-[13px] text-ink-muted">
        {isLogin ? t("Ainda não tem conta?") : t("Já tem conta?")}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(isLogin ? "criar" : "entrar");
            setError(null);
            setNotice(null);
          }}
          className="font-medium text-brand-ink hover:underline"
        >
          {isLogin ? t("Criar conta") : t("Entrar")}
        </button>
      </p>
    </form>
  );
}

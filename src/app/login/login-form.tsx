"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Mode = "entrar" | "criar";

function translateError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.";
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail. Entre com sua senha.";
  if (m.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}

export function LoginForm() {
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
      if (error) return setError(translateError(error.message));
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return setError(translateError(error.message));
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setNotice("Conta criada. Enviamos um link de confirmação para o seu e-mail.");
  }

  const isLogin = mode === "entrar";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg leading-[26px] font-semibold">{isLogin ? "Entrar" : "Criar conta"}</h1>
        <p className="text-[13px] leading-[18px] text-ink-subtle">
          {isLogin ? "Acesse seus atendimentos." : "Comece a organizar seus atendimentos."}
        </p>
      </div>

      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
        />
      </Field>

      <Field label="Senha" htmlFor="password" hint={isLogin ? undefined : "Mínimo de 6 caracteres"}>
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
        {loading ? "Aguarde…" : isLogin ? "Entrar" : "Criar conta"}
      </Button>

      <p className="text-center text-[13px] text-ink-muted">
        {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
        <button
          type="button"
          onClick={() => {
            setMode(isLogin ? "criar" : "entrar");
            setError(null);
            setNotice(null);
          }}
          className="font-medium text-brand-ink hover:underline"
        >
          {isLogin ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { phone } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

type Dados = { nome: string; negocio: string; telefone: string; email: string; senha: string; confirma: string };

/** Mensagem do Supabase (em inglês) → texto em português, que depois passa pelo t(). */
function traduzirErro(message: string) {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com este e-mail. Entre com sua senha.";
  if (m.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("email") && m.includes("invalid")) return "Confira o e-mail digitado.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}

/** Cadastro completo: nome, negócio e telefone já preenchem Minha Conta e Meu Negócio. */
export function CriarContaForm() {
  const { t, prefs } = useI18n();
  const router = useRouter();
  const [d, setD] = useState<Dados>({ nome: "", negocio: "", telefone: "", email: "", senha: "", confirma: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const set = (p: Partial<Dados>) => {
    setD((x) => ({ ...x, ...p }));
    setErro(null);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!d.nome.trim()) return setErro(t("Informe seu nome."));
    if (!d.negocio.trim()) return setErro(t("Informe o nome do seu negócio."));
    if (d.telefone.replace(/\D/g, "").length < 10) return setErro(t("Informe um telefone com DDD."));
    if (d.senha.length < 6) return setErro(t("A senha precisa ter pelo menos 6 caracteres."));
    if (d.senha !== d.confirma) return setErro(t("As duas senhas não são iguais."));
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email: d.email.trim(),
      password: d.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?idioma=${prefs.locale}`,
        data: { name: d.nome.trim(), nome: d.nome.trim(), negocio: d.negocio.trim(), telefone: d.telefone.replace(/\D/g, "") },
      },
    });
    setLoading(false);
    if (error) return setErro(t(traduzirErro(error.message)));
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="grid gap-4">
        <h1 className="text-lg leading-[26px] font-semibold">{t("Confirme seu e-mail")}</h1>
        <Feedback kind="ok">
          {t("Conta criada. Enviamos um link de confirmação para {email}. Abra o link para entrar.", { email: d.email.trim() })}
        </Feedback>
        <Link href="/login" className="text-center text-[13px] font-medium text-brand-ink hover:underline">
          {t("Voltar para o login")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <h1 className="text-lg leading-[26px] font-semibold">{t("Criar conta")}</h1>

      <Field label={t("Seu nome")} required htmlFor="cc-nome">
        <Input id="cc-nome" autoComplete="name" value={d.nome} onChange={(e) => set({ nome: e.target.value })} />
      </Field>
      <Field label={t("Nome do negócio")} required htmlFor="cc-negocio">
        <Input
          id="cc-negocio"
          autoComplete="organization"
          placeholder={t("Exemplo: João Informática")}
          value={d.negocio}
          onChange={(e) => set({ negocio: e.target.value })}
        />
      </Field>
      <Field label={t("Telefone (WhatsApp)")} required htmlFor="cc-tel">
        <Input
          id="cc-tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          value={d.telefone}
          onChange={(e) => set({ telefone: phone(e.target.value) })}
        />
      </Field>
      <Field label={t("E-mail")} required htmlFor="cc-email">
        <Input
          id="cc-email"
          type="email"
          autoComplete="email"
          placeholder={t("voce@email.com")}
          value={d.email}
          onChange={(e) => set({ email: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Senha")} required htmlFor="cc-senha">
          <Input
            id="cc-senha"
            type="password"
            autoComplete="new-password"
            placeholder={t("Mínimo de 6 caracteres")}
            value={d.senha}
            onChange={(e) => set({ senha: e.target.value })}
          />
        </Field>
        <Field label={t("Repita a senha")} required htmlFor="cc-conf">
          <Input id="cc-conf" type="password" autoComplete="new-password" value={d.confirma} onChange={(e) => set({ confirma: e.target.value })} />
        </Field>
      </div>

      {erro ? <Feedback kind="error">{erro}</Feedback> : null}

      <Button type="submit" variant="dark" className="w-full" disabled={loading}>
        {loading ? t("Aguarde…") : t("Criar conta")}
      </Button>

      <p className="text-center text-[13px] text-ink-muted">
        {t("Já tem conta?")}{" "}
        <Link href="/login" className="font-medium text-brand-ink hover:underline">
          {t("Entrar")}
        </Link>
      </p>
    </form>
  );
}

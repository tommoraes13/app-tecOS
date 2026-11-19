"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { phone } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { salvarPrimeiroAcesso } from "./actions";

type Dados = { nome: string; negocio: string; telefone: string; senha: string; confirma: string };

/** Primeiro acesso do convidado: nome, negócio, telefone e a senha que vai usar para entrar. */
export function DefinirSenhaForm({ inicial }: { inicial: { nome: string; negocio: string; telefone: string } }) {
  const { t } = useI18n();
  const router = useRouter();
  const [d, setD] = useState<Dados>({ ...inicial, telefone: inicial.telefone ? phone(inicial.telefone) : "", senha: "", confirma: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = (p: Partial<Dados>) => {
    setD((x) => ({ ...x, ...p }));
    setErro(null);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!d.nome.trim()) return setErro(t("Informe seu nome."));
    if (!d.negocio.trim()) return setErro(t("Informe o nome do seu negócio."));
    if (d.telefone && d.telefone.replace(/\D/g, "").length < 10) return setErro(t("Informe um telefone com DDD."));
    if (d.senha.length < 6) return setErro(t("A senha precisa ter pelo menos 6 caracteres."));
    if (d.senha !== d.confirma) return setErro(t("As duas senhas não são iguais."));
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password: d.senha, data: { name: d.nome.trim() } });
    if (error) {
      setLoading(false);
      return setErro(t("Não foi possível salvar a senha. Abra o link do convite de novo."));
    }
    const r = await salvarPrimeiroAcesso({ nome: d.nome, negocio: d.negocio, telefone: d.telefone });
    setLoading(false);
    if (!r.ok) return setErro(t(r.error));
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div>
        <h1 className="text-lg leading-[26px] font-semibold">{t("Primeiro acesso")}</h1>
        <p className="mt-1 text-[13px] text-ink-muted">{t("Crie a senha que você vai usar para entrar.")}</p>
      </div>

      <Field label={t("Seu nome")} required htmlFor="ps-nome">
        <Input id="ps-nome" autoComplete="name" value={d.nome} onChange={(e) => set({ nome: e.target.value })} />
      </Field>
      <Field label={t("Nome do negócio")} required htmlFor="ps-negocio">
        <Input
          id="ps-negocio"
          autoComplete="organization"
          placeholder={t("Exemplo: João Informática")}
          value={d.negocio}
          onChange={(e) => set({ negocio: e.target.value })}
        />
      </Field>
      <Field label={t("Telefone (WhatsApp)")} htmlFor="ps-tel">
        <Input
          id="ps-tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          value={d.telefone}
          onChange={(e) => set({ telefone: phone(e.target.value) })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Senha")} required htmlFor="ps-senha">
          <Input
            id="ps-senha"
            type="password"
            autoComplete="new-password"
            placeholder={t("Mínimo de 6 caracteres")}
            value={d.senha}
            onChange={(e) => set({ senha: e.target.value })}
          />
        </Field>
        <Field label={t("Repita a senha")} required htmlFor="ps-conf">
          <Input id="ps-conf" type="password" autoComplete="new-password" value={d.confirma} onChange={(e) => set({ confirma: e.target.value })} />
        </Field>
      </div>

      {erro ? <Feedback kind="error">{erro}</Feedback> : null}

      <Button type="submit" variant="dark" className="w-full" disabled={loading}>
        {loading ? t("Aguarde…") : t("Salvar e entrar")}
      </Button>
    </form>
  );
}

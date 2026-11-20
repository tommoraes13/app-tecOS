"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AddressFields } from "@/components/forms/address-fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback, MoneyInput } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { METODOS, metodoComVisita, metodoValido } from "@/lib/documento";
import { cep as formatCep, phone } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { concluirPrimeiroAcesso, type PrimeiroAcessoInput } from "./actions";

const PASSOS = ["Seus dados", "Sua senha", "Seu negócio", "Endereço do negócio", "Como você cobra"] as const;

/**
 * Primeiro acesso em passos curtos, com Próximo e Voltar.
 * A senha é trocada no passo 2; o resto é gravado de uma vez no fim.
 */
export function PrimeiroAcessoWizard({ email, inicial }: { email: string; inicial: PrimeiroAcessoInput }) {
  const { t } = useI18n();
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [f, setF] = useState<PrimeiroAcessoInput>({
    ...inicial,
    celular: inicial.celular ? phone(inicial.celular) : "",
    telefone_negocio: inicial.telefone_negocio ? phone(inicial.telefone_negocio) : "",
    cep: inicial.cep ? formatCep(inicial.cep) : "",
  });
  const [senha, setSenha] = useState({ nova: "", confirma: "", salva: false });
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const set = (p: Partial<PrimeiroAcessoInput>) => {
    setF((x) => ({ ...x, ...p }));
    setErro(null);
  };
  const ultimo = passo === PASSOS.length - 1;
  const opcional = passo === 3 || passo === 4;
  const metodo = metodoValido(f.tipo_precificacao);

  async function proximo() {
    setErro(null);
    if (passo === 0) {
      if (!f.nome.trim()) return setErro(t("Informe seu nome."));
      if (f.celular.replace(/\D/g, "").length < 10) return setErro(t("Informe um celular com DDD."));
    }
    if (passo === 1 && !senha.salva) {
      if (senha.nova.length < 6) return setErro(t("A senha precisa ter pelo menos 6 caracteres."));
      if (senha.nova !== senha.confirma) return setErro(t("As duas senhas não são iguais."));
      setOcupado(true);
      const { error } = await createClient().auth.updateUser({ password: senha.nova });
      setOcupado(false);
      if (error) return setErro(t("Não foi possível salvar a senha. Tente outra senha."));
      setSenha((s) => ({ ...s, salva: true }));
    }
    if (passo === 2) {
      if (!f.negocio.trim()) return setErro(t("Informe o nome do seu negócio."));
      if (!f.telefone_negocio) set({ telefone_negocio: f.celular });
    }
    if (!ultimo) return setPasso((p) => p + 1);
    setOcupado(true);
    const r = await concluirPrimeiroAcesso(f);
    setOcupado(false);
    if (!r.ok) return setErro(t(r.error));
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card className="grid gap-5 p-5 sm:p-7">
      {/* Progresso */}
      <div className="grid gap-2">
        <div className="flex gap-1.5" aria-hidden>
          {PASSOS.map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= passo ? "bg-brand-700" : "bg-surface-muted")} />
          ))}
        </div>
        <p className="text-xs text-ink-subtle">{t("Passo {n} de {total}", { n: passo + 1, total: PASSOS.length })}</p>
        <h1 className="text-lg leading-[26px] font-semibold">{t(PASSOS[passo])}</h1>
        {passo === 0 ? <p className="text-[13px] text-ink-muted">{t("Confira seus dados. Leva menos de 2 minutos.")}</p> : null}
      </div>

      {passo === 0 ? (
        <div className="grid gap-4">
          <Field label={t("Seu nome")} required htmlFor="pa-nome">
            <Input id="pa-nome" autoComplete="name" value={f.nome} onChange={(e) => set({ nome: e.target.value })} />
          </Field>
          <Field label={t("E-mail")} htmlFor="pa-email">
            <Input id="pa-email" type="email" value={email} readOnly className="bg-surface-muted text-ink-muted" />
          </Field>
          <Field label={t("Celular")} required htmlFor="pa-cel">
            <Input
              id="pa-cel"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 98765-4321"
              value={f.celular}
              onChange={(e) => set({ celular: phone(e.target.value) })}
            />
          </Field>
        </div>
      ) : null}

      {passo === 1 ? (
        senha.salva ? (
          <Feedback kind="ok">{t("Senha salva. Use essa senha nas próximas vezes que entrar.")}</Feedback>
        ) : (
          <div className="grid gap-4">
            <p className="text-[13px] text-ink-muted">{t("Troque a senha provisória por uma só sua.")}</p>
            <Field label={t("Nova senha")} required htmlFor="pa-senha">
              <Input
                id="pa-senha"
                type="password"
                autoComplete="new-password"
                placeholder={t("Mínimo de 6 caracteres")}
                value={senha.nova}
                onChange={(e) => setSenha((s) => ({ ...s, nova: e.target.value }))}
              />
            </Field>
            <Field label={t("Repita a senha")} required htmlFor="pa-conf">
              <Input
                id="pa-conf"
                type="password"
                autoComplete="new-password"
                value={senha.confirma}
                onChange={(e) => setSenha((s) => ({ ...s, confirma: e.target.value }))}
              />
            </Field>
          </div>
        )
      ) : null}

      {passo === 2 ? (
        <div className="grid gap-4">
          <Field label={t("Nome do negócio")} required htmlFor="pa-neg">
            <Input
              id="pa-neg"
              autoComplete="organization"
              placeholder={t("Exemplo: João Informática")}
              value={f.negocio}
              onChange={(e) => set({ negocio: e.target.value })}
            />
          </Field>
          <Field label={t("Telefone do negócio (WhatsApp)")} htmlFor="pa-telneg">
            <Input
              id="pa-telneg"
              type="tel"
              inputMode="tel"
              placeholder={f.celular || "(11) 98765-4321"}
              value={f.telefone_negocio}
              onChange={(e) => set({ telefone_negocio: phone(e.target.value) })}
            />
          </Field>
          <Field label={t("CPF ou CNPJ")} htmlFor="pa-doc">
            <Input
              id="pa-doc"
              inputMode="numeric"
              className="font-mono"
              value={f.cpf_cnpj}
              onChange={(e) => set({ cpf_cnpj: e.target.value.replace(/[^\d./-]/g, "") })}
            />
          </Field>
        </div>
      ) : null}

      {passo === 3 ? (
        <AddressFields
          idPrefix="pa"
          value={{
            cep: f.cep,
            endereco: f.endereco,
            numero: f.numero,
            complemento: f.complemento,
            bairro: f.bairro,
            cidade: f.cidade,
            estado: f.estado,
          }}
          onChange={(p) => set(p)}
        />
      ) : null}

      {passo === 4 ? (
        <div className="grid gap-4">
          <div className="grid gap-2" role="radiogroup" aria-label={t("Método de precificação")}>
            {METODOS.map((m) => {
              const ativo = metodo === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => set({ tipo_precificacao: m.value })}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-sm font-medium",
                    ativo ? "border-brand-700 bg-brand-100" : "border-border hover:bg-surface-muted",
                  )}
                >
                  <i className={cn("size-3.5 shrink-0 rounded-full border-2", ativo ? "border-brand-700 bg-brand-700" : "border-border-control")} />
                  {t(m.label)}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {metodo === "hora_visita" ? (
              <Field label={t("Valor da hora técnica")} htmlFor="pa-vh">
                <MoneyInput id="pa-vh" value={f.valor_hora} onChange={(v) => set({ valor_hora: v })} />
              </Field>
            ) : null}
            {metodoComVisita(metodo) ? (
              <Field label={t("Valor da visita técnica")} htmlFor="pa-vv">
                <MoneyInput id="pa-vv" value={f.valor_visita} onChange={(v) => set({ valor_visita: v })} />
              </Field>
            ) : null}
          </div>
          <p className="text-xs text-ink-subtle">{t("Dá para mudar depois em Meu Negócio › Configurar Precificação.")}</p>
        </div>
      ) : null}

      {erro ? <Feedback kind="error">{erro}</Feedback> : null}

      <div className="flex items-center gap-2">
        {passo > 0 ? (
          <Button variant="ghost" icon={<ArrowLeft />} onClick={() => setPasso((p) => p - 1)} disabled={ocupado}>
            {t("Voltar")}
          </Button>
        ) : null}
        <span className="flex-1" />
        {opcional && !ultimo ? (
          <Button variant="ghost" onClick={() => setPasso((p) => p + 1)} disabled={ocupado}>
            {t("Pular")}
          </Button>
        ) : null}
        <Button variant="dark" onClick={() => void proximo()} disabled={ocupado} icon={ultimo ? <Check /> : <ArrowRight />}>
          {ocupado ? t("Aguarde…") : ultimo ? t("Começar a usar") : t("Próximo")}
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { VoltarMobile } from "@/components/layout/voltar-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback, MoneyInput, Select } from "@/components/ui/controls";
import { Field } from "@/components/ui/input";
import type { Tables } from "@/lib/database.types";
import { METODOS, metodoComVisita, metodoValido, type Metodo } from "@/lib/documento";
import { useI18n } from "@/i18n/client";
import { duration } from "@/lib/format";
import { DURACOES } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { salvarPrecificacao, type PrecificacaoInput } from "./actions";

/** Explicação curta de cada método, mostrada no cartão de escolha. */
const EXPLICA: Record<Metodo, string> = {
  servico: "Cobra o valor de cada serviço da Tabela de Preços.",
  servico_visita: "Cobra o serviço e acrescenta a visita técnica.",
  hora_visita: "Horas (tempo médio dos serviços) × valor da hora, mais a visita.",
  livre: "Você digita o valor cobrado em cada atendimento.",
};

export function PrecificacaoForm({ negocio }: { negocio: Tables<"meu_negocio"> }) {
  const { t } = useI18n();
  const [form, setForm] = useState<PrecificacaoInput>({
    tipo_precificacao: metodoValido(negocio.tipo_precificacao),
    valor_hora: negocio.valor_hora,
    valor_visita: negocio.valor_visita,
    duracao_visita_min: negocio.duracao_visita_min,
    valor_km: negocio.valor_km,
  });
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const metodo = metodoValido(form.tipo_precificacao);

  const set = (patch: Partial<PrecificacaoInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setResult(null);
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await salvarPrecificacao(form);
      setResult(r.ok ? { kind: "ok", text: t("Precificação salva.") } : { kind: "error", text: t(r.error) });
    });
  }

  const duracoes = DURACOES.includes(form.duracao_visita_min)
    ? DURACOES
    : [...DURACOES, form.duracao_visita_min].sort((a, b) => a - b);

  return (
    <form onSubmit={onSubmit}>
      <Card className="grid max-w-[720px] gap-5 p-5 sm:p-6">
        <div className="grid gap-2">
          <h2 className="text-[15px] font-semibold">{t("Método de precificação")}</h2>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("Método de precificação")}>
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
                    "grid gap-0.5 rounded-lg border p-3 text-left",
                    ativo ? "border-brand-700 bg-brand-100" : "border-border hover:bg-surface-muted",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <i className={cn("size-3.5 shrink-0 rounded-full border-2", ativo ? "border-brand-700 bg-brand-700" : "border-border-control")} />
                    {t(m.label)}
                  </span>
                  <span className="pl-5.5 text-xs text-ink-subtle">{t(EXPLICA[m.value])}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {metodo === "hora_visita" ? (
            <Field label={t("Valor da hora técnica")} htmlFor="vh">
              <MoneyInput id="vh" value={form.valor_hora} onChange={(v) => set({ valor_hora: v })} />
            </Field>
          ) : null}
          {metodoComVisita(metodo) ? (
            <Field label={t("Valor da visita técnica")} htmlFor="vv">
              <MoneyInput id="vv" value={form.valor_visita} onChange={(v) => set({ valor_visita: v })} />
            </Field>
          ) : null}
          <Field label={t("Duração padrão da visita técnica")} htmlFor="dur">
            <Select id="dur" value={form.duracao_visita_min} onChange={(e) => set({ duracao_visita_min: Number(e.target.value) })}>
              {duracoes.map((m) => (
                <option key={m} value={m}>
                  {duration(m)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Valor adicional por km")} htmlFor="vkm">
            <MoneyInput id="vkm" value={form.valor_km} onChange={(v) => set({ valor_km: v })} />
          </Field>
        </div>

        {result ? <Feedback kind={result.kind}>{result.text}</Feedback> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <VoltarMobile />
          <Button type="submit" variant="dark" disabled={pending} className="w-full sm:w-auto">
            {pending ? t("Salvando…") : t("Salvar precificação")}
          </Button>
        </div>
      </Card>
    </form>
  );
}

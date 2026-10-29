"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback, MoneyInput, Select, Switch } from "@/components/ui/controls";
import { Field } from "@/components/ui/input";
import type { Tables } from "@/lib/database.types";
import { duration } from "@/lib/format";
import { DURACOES } from "@/lib/labels";
import { salvarPrecificacao, type PrecificacaoInput } from "./actions";

export function PrecificacaoForm({ negocio }: { negocio: Tables<"meu_negocio"> }) {
  const [form, setForm] = useState<PrecificacaoInput>({
    tipo_precificacao: negocio.tipo_precificacao ?? "por_servico",
    valor_visita: negocio.valor_visita,
    duracao_visita_min: negocio.duracao_visita_min,
    cobrar_visita: negocio.cobrar_visita,
    valor_km: negocio.valor_km,
  });
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const set = (patch: Partial<PrecificacaoInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setResult(null);
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await salvarPrecificacao(form);
      setResult(r.ok ? { kind: "ok", text: "Precificação salva." } : { kind: "error", text: r.error });
    });
  }

  const duracoes = DURACOES.includes(form.duracao_visita_min)
    ? DURACOES
    : [...DURACOES, form.duracao_visita_min].sort((a, b) => a - b);

  return (
    <form onSubmit={onSubmit}>
      <Card className="grid max-w-[720px] gap-5 p-5 sm:p-6">
        <p className="text-[13px] text-ink-subtle">
          Esses valores vêm preenchidos em cada novo atendimento e orçamento. Você pode mudar em cada um.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo de precificação" htmlFor="tp">
            <Select id="tp" value={form.tipo_precificacao} onChange={(e) => set({ tipo_precificacao: e.target.value })}>
              <option value="por_servico">Por serviço (valor fixo de cada serviço)</option>
              <option value="por_hora">Por hora técnica</option>
            </Select>
          </Field>
          <Field label="Duração padrão da visita técnica" htmlFor="dur">
            <Select
              id="dur"
              value={form.duracao_visita_min}
              onChange={(e) => set({ duracao_visita_min: Number(e.target.value) })}
            >
              {duracoes.map((m) => (
                <option key={m} value={m}>
                  {duration(m)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor da visita padrão" htmlFor="vv">
            <MoneyInput id="vv" value={form.valor_visita} onChange={(v) => set({ valor_visita: v })} />
          </Field>
          <Field label="Valor adicional por km" htmlFor="vkm" hint="Para uso futuro no cálculo de deslocamento">
            <MoneyInput id="vkm" value={form.valor_km} onChange={(v) => set({ valor_km: v })} />
          </Field>
        </div>

        <div className="rounded-lg bg-surface-muted p-4">
          <Switch
            checked={form.cobrar_visita}
            onChange={(v) => set({ cobrar_visita: v })}
            label={<span className="font-medium">Cobrar visita por padrão</span>}
          />
          <p className="mt-1.5 pl-11 text-xs text-ink-subtle">
            Desligado: o valor da visita não entra sozinho no total dos novos atendimentos.
          </p>
        </div>

        {result ? <Feedback kind={result.kind}>{result.text}</Feedback> : null}

        <div className="flex justify-end">
          <Button type="submit" variant="dark" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Salvando…" : "Salvar precificação"}
          </Button>
        </div>
      </Card>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { AddressFields, type Address } from "@/components/forms/address-fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import type { Tables } from "@/lib/database.types";
import { useI18n } from "@/i18n/client";
import { cep, phone } from "@/lib/format";
import { salvarEmpresa, type EmpresaInput } from "./actions";

export function EmpresaForm({ negocio }: { negocio: Tables<"meu_negocio"> }) {
  const { t } = useI18n();
  const [form, setForm] = useState<EmpresaInput>({
    nome_fantasia: negocio.nome_fantasia ?? "",
    razao_social: negocio.razao_social ?? "",
    cpf_cnpj: negocio.cpf_cnpj ?? "",
    email: negocio.email ?? "",
    telefone: phone(negocio.telefone),
    cep: cep(negocio.cep),
    endereco: negocio.endereco ?? "",
    numero: negocio.numero ?? "",
    complemento: negocio.complemento ?? "",
    bairro: negocio.bairro ?? "",
    cidade: negocio.cidade ?? "",
    estado: negocio.estado ?? "",
    regiao_atendimento_km: negocio.regiao_atendimento_km,
    garantia_meses_padrao: negocio.garantia_meses_padrao,
  });
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const set = (patch: Partial<EmpresaInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setResult(null);
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await salvarEmpresa(form);
      setResult(r.ok ? { kind: "ok", text: t("Dados da empresa salvos.") } : { kind: "error", text: t(r.error) });
    });
  }

  const address: Address = {
    cep: form.cep,
    endereco: form.endereco,
    numero: form.numero,
    complemento: form.complemento,
    bairro: form.bairro,
    cidade: form.cidade,
    estado: form.estado,
  };

  return (
    <form onSubmit={onSubmit}>
      <Card className="grid gap-6 p-5 sm:p-6">
        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">{t("Identificação")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("Nome fantasia")} htmlFor="nf" hint={t("Aparece no topo dos PDFs")}>
              <Input id="nf" value={form.nome_fantasia} onChange={(e) => set({ nome_fantasia: e.target.value })} />
            </Field>
            <Field label={t("Razão social")} htmlFor="rs">
              <Input id="rs" value={form.razao_social} onChange={(e) => set({ razao_social: e.target.value })} />
            </Field>
            <Field label={t("CPF ou CNPJ")} htmlFor="doc" hint={t("Opcional")}>
              <Input
                id="doc"
                inputMode="numeric"
                className="font-mono"
                value={form.cpf_cnpj}
                onChange={(e) => set({ cpf_cnpj: e.target.value.replace(/[^\d./-]/g, "") })}
              />
            </Field>
            <Field label={t("Região de atendimento")} htmlFor="km" hint={t("Raio em km a partir do seu endereço")}>
              <Input
                id="km"
                inputMode="decimal"
                value={form.regiao_atendimento_km ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                  set({ regiao_atendimento_km: v === "" ? null : Number(v) });
                }}
              />
            </Field>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">{t("Garantia")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("Garantia padrão")} htmlFor="gar" hint={t("Vem preenchida em cada nova OS e orçamento")}>
              <Select
                id="gar"
                value={form.garantia_meses_padrao}
                onChange={(e) => set({ garantia_meses_padrao: Number(e.target.value) })}
              >
                {[...new Set([0, 1, 2, 3, 6, 12, 18, 24, form.garantia_meses_padrao])]
                  .sort((a, b) => a - b)
                  .map((m) => (
                    <option key={m} value={m}>
                      {m === 0 ? t("Sem garantia") : m === 1 ? t("1 mês") : t("{n} meses", { n: m })}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">{t("Contato")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("E-mail")} htmlFor="em">
              <Input id="em" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label={t("Telefone")} htmlFor="tel">
              <Input
                id="tel"
                type="tel"
                inputMode="tel"
                placeholder="(11) 90000-0000"
                value={form.telefone}
                onChange={(e) => set({ telefone: phone(e.target.value) })}
              />
            </Field>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">{t("Endereço")}</h2>
          <AddressFields idPrefix="empresa" value={address} onChange={(patch) => set(patch)} />
        </section>

        {result ? <Feedback kind={result.kind}>{result.text}</Feedback> : null}

        <div className="flex justify-end">
          <Button type="submit" variant="dark" disabled={pending} className="w-full sm:w-auto">
            {pending ? t("Salvando…") : t("Salvar dados")}
          </Button>
        </div>
      </Card>
    </form>
  );
}

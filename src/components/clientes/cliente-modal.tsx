"use client";

import { useEffect, useState, useTransition } from "react";
import { salvarCliente, type ClienteInput } from "@/app/(app)/clientes/actions";
import { AddressFields } from "@/components/forms/address-fields";
import { Button } from "@/components/ui/button";
import { Feedback, Select, Textarea } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";
import type { Enums, Tables } from "@/lib/database.types";
import { cep, phone } from "@/lib/format";
import { CANAL_LABEL } from "@/lib/labels";

type Cliente = Tables<"base_clientes">;

function toInput(c?: Cliente | null, nomeInicial = ""): ClienteInput {
  return {
    id: c?.id,
    nome: c?.nome ?? nomeInicial,
    telefone: phone(c?.telefone),
    email: c?.email ?? "",
    canal: c?.canal ?? "",
    cep: cep(c?.cep),
    endereco: c?.endereco ?? "",
    numero: c?.numero ?? "",
    complemento: c?.complemento ?? "",
    bairro: c?.bairro ?? "",
    cidade: c?.cidade ?? "",
    estado: c?.estado ?? "",
    observacoes: c?.observacoes ?? "",
  };
}

/** Cadastro e edição de cliente. Usado na tela de Clientes e no cadastro rápido dentro da OS. */
export function ClienteModal({
  open,
  onClose,
  cliente,
  nomeInicial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  nomeInicial?: string;
  onSaved: (cliente: Cliente) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<ClienteInput>(() => toInput(cliente, nomeInicial));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (open) {
      setForm(toInput(cliente, nomeInicial));
      setError(null);
    }
  }, [open, cliente, nomeInicial]);

  const set = (patch: Partial<ClienteInput>) => setForm((f) => ({ ...f, ...patch }));

  function save() {
    start(async () => {
      const r = await salvarCliente(form);
      if (!r.ok) return setError(t(r.error));
      onSaved(r.data);
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cliente ? t("Editar cliente") : t("Novo cliente")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Cancelar")}
          </Button>
          <Button variant="dark" onClick={save} disabled={pending}>
            {pending ? t("Salvando…") : t("Salvar cliente")}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t("Nome do cliente")} required htmlFor="cl-nome">
              <Input id="cl-nome" autoFocus value={form.nome} onChange={(e) => set({ nome: e.target.value })} />
            </Field>
          </div>
          <Field label={t("Telefone")} required htmlFor="cl-tel">
            <Input
              id="cl-tel"
              type="tel"
              inputMode="tel"
              placeholder="(11) 90000-0000"
              value={form.telefone}
              onChange={(e) => set({ telefone: phone(e.target.value) })}
            />
          </Field>
          <Field label={t("E-mail")} htmlFor="cl-email">
            <Input id="cl-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("Como chegou até você")} htmlFor="cl-canal">
              <Select
                id="cl-canal"
                value={form.canal}
                onChange={(e) => set({ canal: e.target.value as Enums<"cliente_canal"> | "" })}
              >
                <option value="">{t("Não informado")}</option>
                {Object.entries(CANAL_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {t(l)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">{t("Endereço")}</h3>
          <AddressFields
            idPrefix="cliente"
            value={{
              cep: form.cep,
              endereco: form.endereco,
              numero: form.numero,
              complemento: form.complemento,
              bairro: form.bairro,
              cidade: form.cidade,
              estado: form.estado,
            }}
            onChange={(patch) => set(patch)}
          />
        </div>

        <Field label={t("Observações")} htmlFor="cl-obs">
          <Textarea id="cl-obs" value={form.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
        </Field>

        {error ? <Feedback kind="error">{error}</Feedback> : null}
      </div>
    </Modal>
  );
}

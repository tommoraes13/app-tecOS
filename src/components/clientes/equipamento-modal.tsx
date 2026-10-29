"use client";

import { useEffect, useState, useTransition } from "react";
import { excluirEquipamento, salvarEquipamento, type EquipamentoInput, type EquipamentoSalvo } from "@/app/(app)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Feedback, Select, Switch, Textarea } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Enums, Tables } from "@/lib/database.types";
import { asSpecs, CAMPOS, NOME_PLACEHOLDER, secretKeys, type TipoEquipamento } from "@/lib/equipamentos";
import { ESTADO_LABEL, EQUIPAMENTO_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { SecretInput } from "./secret-field";

type Equipamento = Tables<"base_equipamentos">;

function toInput(clienteId: string, e?: Equipamento | null): EquipamentoInput {
  return {
    id: e?.id,
    cliente_id: e?.cliente_id ?? clienteId,
    tipo: e?.tipo ?? "desktop",
    nome: e?.nome ?? "",
    specs: e ? asSpecs(e.especificacoes) : {},
    senhas: {},
    estado_geral: e?.estado_geral ?? "",
    estado_detalhe: e?.estado_detalhe ?? "",
  };
}

/** Cadastro e edição de equipamento, com os campos do tipo escolhido. */
export function EquipamentoModal({
  open,
  onClose,
  clienteId,
  equipamento,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  equipamento?: Equipamento | null;
  onSaved: (e: EquipamentoSalvo) => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState<EquipamentoInput>(() => toInput(clienteId, equipamento));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saved = new Set(equipamento ? secretKeys(equipamento.senhas) : []);

  useEffect(() => {
    if (open) {
      setForm(toInput(clienteId, equipamento));
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, clienteId, equipamento]);

  const setSpec = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: value } }));
  const setSecret = (key: string, value: string | undefined) =>
    setForm((f) => ({ ...f, senhas: { ...f.senhas, [key]: value } }));

  function save() {
    start(async () => {
      const r = await salvarEquipamento(form);
      if (!r.ok) return setError(r.error);
      onSaved(r.data);
    });
  }

  function remove() {
    if (!equipamento) return;
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await excluirEquipamento(equipamento.id);
      if (!r.ok) return setError(r.error);
      onDeleted?.();
    });
  }

  const campos = CAMPOS[form.tipo].filter((c) => !c.showIf || c.showIf(form.specs));
  const grupos = [...new Set(campos.map((c) => c.group ?? ""))];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={equipamento ? "Editar equipamento" : "Novo equipamento"}
      footer={
        <>
          {equipamento && onDeleted ? (
            <Button variant="danger" onClick={remove} disabled={pending} className="mr-auto">
              {confirmDelete ? "Confirmar exclusão" : "Excluir"}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={save} disabled={pending}>
            {pending ? "Salvando…" : "Salvar equipamento"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo do equipamento" required htmlFor="eq-tipo">
            <Select
              id="eq-tipo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoEquipamento }))}
            >
              {Object.entries(EQUIPAMENTO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nome do equipamento" required htmlFor="eq-nome">
            <Input
              id="eq-nome"
              placeholder={NOME_PLACEHOLDER[form.tipo]}
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </Field>
        </div>

        {grupos.map((g) => (
          <section key={g} className="grid gap-3">
            {g ? <h3 className="text-sm font-semibold">{g}</h3> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {campos
                .filter((c) => (c.group ?? "") === g)
                .map((c) => {
                  const id = `eq-${c.key}`;
                  const v = form.specs[c.key];
                  if (c.kind === "toggle") {
                    return (
                      <div key={c.key} className={cn("flex min-h-11 items-center", c.wide && "sm:col-span-2")}>
                        <Switch checked={v === true} onChange={(on) => setSpec(c.key, on)} label={c.label} />
                      </div>
                    );
                  }
                  return (
                    <div key={c.key} className={cn(c.wide && "sm:col-span-2")}>
                      <Field label={c.label} required={c.required} htmlFor={id}>
                        {c.kind === "secret" ? (
                          <SecretInput
                            id={id}
                            equipamentoId={equipamento?.id}
                            campo={c.key}
                            saved={saved.has(c.key)}
                            value={form.senhas[c.key]}
                            onChange={(val) => setSecret(c.key, val)}
                          />
                        ) : c.kind === "select" ? (
                          <Select id={id} value={typeof v === "string" ? v : ""} onChange={(e) => setSpec(c.key, e.target.value)}>
                            <option value="">Selecione</option>
                            {c.options?.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            id={id}
                            placeholder={c.placeholder}
                            className={cn(c.kind === "mono" && "font-mono text-[13px]")}
                            value={typeof v === "string" ? v : ""}
                            onChange={(e) => setSpec(c.key, e.target.value)}
                          />
                        )}
                      </Field>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold">Estado geral</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ESTADO_LABEL) as Enums<"equipamento_estado">[]).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setForm((f) => ({ ...f, estado_geral: f.estado_geral === estado ? "" : estado }))}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[13px] font-medium",
                  form.estado_geral === estado
                    ? "border-brand-700 bg-brand-100 text-brand-ink"
                    : "border-border text-ink-muted hover:bg-surface-muted",
                )}
              >
                {ESTADO_LABEL[estado]}
              </button>
            ))}
          </div>
          {form.estado_geral ? (
            <Textarea
              aria-label="Detalhes do estado"
              placeholder="Detalhes: o que está funcionando, qual o defeito, desde quando"
              value={form.estado_detalhe}
              onChange={(e) => setForm((f) => ({ ...f, estado_detalhe: e.target.value }))}
            />
          ) : null}
        </section>

        {error ? <Feedback kind="error">{error}</Feedback> : null}
      </div>
    </Modal>
  );
}

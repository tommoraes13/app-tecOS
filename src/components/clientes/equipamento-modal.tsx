"use client";

import { useEffect, useState, useTransition } from "react";
import { excluirEquipamento, salvarEquipamento, type EquipamentoInput, type EquipamentoSalvo } from "@/app/(app)/clientes/actions";
import { Button } from "@/components/ui/button";
import { CollapsibleSection, Feedback, Select, Switch, Textarea } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";
import type { Tables } from "@/lib/database.types";
import { asSpecs, CAMPOS, ESTADO_ATIVO, ESTADO_CAMPOS, GRUPOS, NOME_PLACEHOLDER, secretKeys, type TipoEquipamento } from "@/lib/equipamentos";
import { EQUIPAMENTO_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { SecretInput } from "./secret-field";

type Equipamento = Tables<"base_equipamentos">;

/** Equipamento antigo com "detalhes do estado": vira o texto de Sintomas na seção nova. */
function comEstadoAntigo(e?: Equipamento | null) {
  const specs = e ? asSpecs(e.especificacoes) : {};
  if (e?.estado_detalhe && !specs.estado_sintomas) {
    specs[ESTADO_ATIVO] = true;
    specs.estado_sintomas = e.estado_detalhe;
  }
  return specs;
}

function toInput(clienteId: string, e?: Equipamento | null): EquipamentoInput {
  return {
    id: e?.id,
    cliente_id: e?.cliente_id ?? clienteId,
    tipo: e?.tipo ?? "desktop",
    nome: e?.nome ?? "",
    specs: comEstadoAntigo(e),
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
  const { t } = useI18n();
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
      if (!r.ok) return setError(t(r.error));
      onSaved(r.data);
    });
  }

  function remove() {
    if (!equipamento) return;
    if (!confirmDelete) return setConfirmDelete(true);
    start(async () => {
      const r = await excluirEquipamento(equipamento.id);
      if (!r.ok) return setError(t(r.error));
      onDeleted?.();
    });
  }

  const campos = CAMPOS[form.tipo].filter((c) => !c.showIf || c.showIf(form.specs));
  const grupos = GRUPOS.filter((g) => campos.some((c) => (c.group ?? "Outros") === g));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={equipamento ? t("Editar equipamento") : t("Novo equipamento")}
      footer={
        <>
          {equipamento && onDeleted ? (
            <Button variant={confirmDelete ? "dangerSolid" : "danger"} onClick={remove} disabled={pending} className="mr-auto">
              {confirmDelete ? t("Confirmar exclusão") : t("Excluir")}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            {t("Cancelar")}
          </Button>
          <Button variant="dark" onClick={save} disabled={pending}>
            {pending ? t("Salvando…") : t("Salvar equipamento")}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Tipo do equipamento")} required htmlFor="eq-tipo">
            <Select
              id="eq-tipo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoEquipamento }))}
            >
              {Object.entries(EQUIPAMENTO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {t(l)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("Nome do equipamento")} required htmlFor="eq-nome">
            <Input
              id="eq-nome"
              placeholder={t(NOME_PLACEHOLDER[form.tipo])}
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </Field>
        </div>

        {/* Seções recolhidas: Acesso, Hardware, Sistema e Outros (abre ao tocar no nome). */}
        {grupos.map((g) => {
          const doGrupo = campos.filter((c) => (c.group ?? "Outros") === g);
          const preenchidos = doGrupo.filter((c) =>
            c.kind === "secret" ? saved.has(c.key) || Boolean(form.senhas[c.key]) : c.kind === "toggle" ? form.specs[c.key] === true : Boolean(form.specs[c.key]),
          ).length;
          return (
            <CollapsibleSection
              key={`${form.tipo}-${g}`}
              title={t(g)}
              enabled={false}
              alwaysOn
              summary={preenchidos ? t("{n} preenchidos", { n: preenchidos }) : t("Nada preenchido")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {doGrupo.map((c) => {
                  const id = `eq-${c.key}`;
                  const v = form.specs[c.key];
                  if (c.kind === "toggle") {
                    return (
                      <div key={c.key} className={cn("flex min-h-11 items-center", c.wide && "sm:col-span-2")}>
                        <Switch checked={v === true} onChange={(on) => setSpec(c.key, on)} label={t(c.label)} />
                      </div>
                    );
                  }
                  return (
                    <div key={c.key} className={cn(c.wide && "sm:col-span-2")}>
                      <Field label={t(c.label)} required={c.required} htmlFor={id}>
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
                            <option value="">{t("Selecione")}</option>
                            {c.options?.map((o) => (
                              <option key={o} value={o}>
                                {t(o)}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            id={id}
                            placeholder={c.placeholder ? t(c.placeholder) : undefined}
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
            </CollapsibleSection>
          );
        })}

        {/* Estado geral: liga a seção e descreve sintomas, defeitos e solução. */}
        <CollapsibleSection
          title={t("Estado geral")}
          enabled={form.specs[ESTADO_ATIVO] === true}
          onEnabledChange={(on) => setSpec(ESTADO_ATIVO, on)}
          summary={form.specs[ESTADO_ATIVO] === true ? undefined : t("Desligado")}
        >
          {ESTADO_CAMPOS.map((c) => (
            <Field key={c.key} label={t(c.label)} htmlFor={`eq-${c.key}`}>
              <Textarea
                id={`eq-${c.key}`}
                placeholder={t(c.placeholder)}
                value={typeof form.specs[c.key] === "string" ? (form.specs[c.key] as string) : ""}
                onChange={(e) => setSpec(c.key, e.target.value)}
              />
            </Field>
          ))}
        </CollapsibleSection>

        {error ? <Feedback kind="error">{error}</Feedback> : null}
      </div>
    </Modal>
  );
}

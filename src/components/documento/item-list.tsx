"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboItem } from "@/components/ui/combobox";
import { MoneyInput, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { horasDoServico, newKey, type ItemForm } from "@/lib/documento";
import { useI18n } from "@/i18n/client";
import { duration } from "@/lib/format";

export type CatalogEntry = { id: string; nome: string; codigo: string | null; valor: number; tempo_min: number | null };
export type EquipOption = { id: string; nome: string };

/** Lista de serviços ou de produtos da OS/orçamento: busca no catálogo ou texto livre ("Outro"). */
export function ItemList({
  kind,
  itens,
  onChange,
  catalogo,
  equipamentos,
  valorHora,
  semValor = false,
}: {
  kind: "servico" | "produto";
  itens: ItemForm[];
  onChange: (itens: ItemForm[]) => void;
  catalogo: CatalogEntry[];
  equipamentos: EquipOption[];
  /** Hora Técnica: cada serviço vira horas (tempo médio) × valor da hora */
  valorHora?: number;
  /** Livre: o total é digitado; os itens não têm valor */
  semValor?: boolean;
}) {
  const { t, fmt } = useI18n();
  const sv = kind === "servico";
  const porHora = sv && valorHora !== undefined;
  const comboItems: ComboItem[] = catalogo.map((c) => ({
    id: c.id,
    label: c.nome,
    sublabel: c.codigo ?? undefined,
    right: semValor ? undefined : porHora ? (c.tempo_min ? duration(c.tempo_min) : undefined) : fmt.money(c.valor),
  }));

  const patch = (key: string, p: Partial<ItemForm>) => onChange(itens.map((i) => (i.key === key ? { ...i, ...p } : i)));

  function add() {
    onChange([
      ...itens,
      {
        key: newKey(),
        catalogId: null,
        descricao: "",
        quantidade: 1,
        valor_unitario: porHora ? (valorHora ?? 0) : 0,
        equipamento_id: null,
        tempo_min: null,
      },
    ]);
  }

  return (
    <div className="grid gap-3">
      {itens.length === 0 ? <p className="text-[13px] text-ink-subtle">{sv ? t("Nenhum serviço adicionado.") : t("Nenhum produto adicionado.")}</p> : null}
      {itens.map((item, idx) => (
        <div key={item.key} className="grid gap-3 rounded-lg bg-surface-muted p-3 sm:grid-cols-12">
          <div className="sm:col-span-12">
            <Field label={sv ? t("Serviço {n}", { n: idx + 1 }) : t("Produto {n}", { n: idx + 1 })} htmlFor={`${item.key}-desc`}>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <Combobox
                    id={`${item.key}-desc`}
                    items={comboItems}
                    valueLabel={item.descricao}
                    placeholder={sv ? t("Buscar serviço no catálogo ou digitar") : t("Buscar produto no catálogo ou digitar")}
                    emptyText={
                      sv
                        ? t("Nenhum serviço no catálogo. Digite para usar um avulso.")
                        : t("Nenhum produto no catálogo. Digite para usar um avulso.")
                    }
                    freeLabel={(text) => t("Outro: usar “{texto}”", { texto: text })}
                    commitOnBlur
                    onFree={(text) => patch(item.key, { catalogId: null, descricao: text, tempo_min: null })}
                    onSelect={(sel) => {
                      if (!sel) return patch(item.key, { catalogId: null, descricao: "", tempo_min: null });
                      const c = catalogo.find((x) => x.id === sel.id);
                      if (!c) return;
                      if (porHora)
                        patch(item.key, {
                          catalogId: c.id,
                          descricao: c.nome,
                          quantidade: horasDoServico(c.tempo_min),
                          valor_unitario: valorHora ?? 0,
                          tempo_min: c.tempo_min,
                        });
                      else patch(item.key, { catalogId: c.id, descricao: c.nome, valor_unitario: c.valor, tempo_min: c.tempo_min });
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange(itens.filter((i) => i.key !== item.key))}
                  aria-label={sv ? t("Remover serviço") : t("Remover produto")}
                  className="inline-grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-ink-subtle hover:text-danger lg:size-10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Field>
          </div>
          <div className={semValor ? "sm:col-span-6" : "sm:col-span-4"}>
            <Field label={porHora ? t("Horas") : t("Quantidade")} htmlFor={`${item.key}-qtd`}>
              {porHora ? (
                <HorasInput id={`${item.key}-qtd`} value={item.quantidade} onChange={(n) => patch(item.key, { quantidade: n })} />
              ) : (
                <QtyInput id={`${item.key}-qtd`} value={item.quantidade} onChange={(n) => patch(item.key, { quantidade: n })} />
              )}
            </Field>
          </div>
          {!semValor ? (
            <div className="sm:col-span-4">
              <Field label={porHora ? t("Valor da hora") : t("Valor unitário")} htmlFor={`${item.key}-valor`}>
                <MoneyInput id={`${item.key}-valor`} value={item.valor_unitario} onChange={(v) => patch(item.key, { valor_unitario: v })} />
              </Field>
            </div>
          ) : null}
          <div className={semValor ? "sm:col-span-6" : "sm:col-span-4"}>
            <Field label={t("Vincular equipamento")} htmlFor={`${item.key}-eq`}>
              <Select
                id={`${item.key}-eq`}
                value={item.equipamento_id ?? ""}
                onChange={(e) => patch(item.key, { equipamento_id: e.target.value || null })}
                disabled={equipamentos.length === 0}
              >
                <option value="">{equipamentos.length ? t("Nenhum") : t("Cliente sem equipamentos")}</option>
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {!semValor && item.quantidade !== 1 ? (
            <p className="text-right text-xs text-ink-muted tabular-nums sm:col-span-12">
              {t("Subtotal")} {fmt.money(item.quantidade * item.valor_unitario)}
            </p>
          ) : null}
        </div>
      ))}
      <div>
        <Button variant="outline" size="sm" icon={<Plus />} onClick={add}>
          {sv ? t("Adicionar serviço") : t("Adicionar produto")}
        </Button>
      </div>
    </div>
  );
}

/** Quantidade com botões de menos e mais; aceita digitar. */
function QtyInput({ id, value, onChange }: { id: string; value: number; onChange: (n: number) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const btn =
    "inline-grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-ink-muted hover:text-ink lg:size-10";
  return (
    <div className="flex gap-1.5">
      <button type="button" aria-label={t("Diminuir")} className={btn} onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus className="size-4" />
      </button>
      <Input
        id={id}
        inputMode="numeric"
        className="text-center tabular-nums"
        value={text}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
          setText(digits);
          if (digits && Number(digits) > 0) onChange(Number(digits));
        }}
        onBlur={() => {
          if (!text || Number(text) < 1) setText(String(value));
        }}
      />
      <button type="button" aria-label={t("Aumentar")} className={btn} onClick={() => onChange(value + 1)}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** Horas com passos de meia hora; aceita digitar "1,5". */
function HorasInput({ id, value, onChange }: { id: string; value: number; onChange: (n: number) => void }) {
  const { t, fmt } = useI18n();
  const mostrar = (n: number) => fmt.number(n, n % 1 ? 2 : 0);
  const [text, setText] = useState(mostrar(value));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setText(mostrar(value)), [value]);
  const btn =
    "inline-grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-ink-muted hover:text-ink lg:size-10";
  return (
    <div className="flex gap-1.5">
      <button type="button" aria-label={t("Diminuir")} className={btn} onClick={() => onChange(Math.max(0.5, value - 0.5))}>
        <Minus className="size-4" />
      </button>
      <Input
        id={id}
        inputMode="decimal"
        className="text-center tabular-nums"
        value={text}
        onChange={(e) => {
          const limpo = e.target.value.replace(/[^\d,.]/g, "").slice(0, 6);
          setText(limpo);
          const n = Number(limpo.replace(",", "."));
          if (Number.isFinite(n) && n > 0) onChange(Math.round(n * 100) / 100);
        }}
        onBlur={() => setText(mostrar(value))}
      />
      <button type="button" aria-label={t("Aumentar")} className={btn} onClick={() => onChange(value + 0.5)}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

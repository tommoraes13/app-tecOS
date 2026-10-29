"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { finalizarAtendimento, salvarAtendimento } from "@/app/(app)/servicos/actions";
import { salvarOrcamento, transformarEmAtendimento } from "@/app/(app)/orcamentos/actions";
import { ClienteModal } from "@/components/clientes/cliente-modal";
import { EquipamentoModal } from "@/components/clientes/equipamento-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox, CollapsibleSection, Feedback, MoneyInput, Select, Switch, Textarea } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Tables } from "@/lib/database.types";
import {
  duracaoSugerida,
  newKey,
  STATUS_OPCOES,
  totais,
  type CatalogoProduto,
  type CatalogoServico,
  type ClienteOpcao,
  type DocForm,
  type Padroes,
} from "@/lib/documento";
import { docNumber, duration, money, phone, todayISO } from "@/lib/format";
import { DURACOES, EQUIPAMENTO_CURTO } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ItemList } from "./item-list";

type Equipamento = Tables<"base_equipamentos">;
type Mode = "os" | "orcamento";

export type Vinculo = { id: string; numero: number } | null;

export function DocumentoForm({
  mode,
  initial,
  clientes: clientesIniciais,
  servicos,
  produtos,
  padroes,
  orcamentoOrigem = null,
  osGerada = null,
}: {
  mode: Mode;
  initial: DocForm;
  clientes: ClienteOpcao[];
  servicos: CatalogoServico[];
  produtos: CatalogoProduto[];
  padroes: Padroes;
  orcamentoOrigem?: Vinculo;
  osGerada?: Vinculo;
}) {
  const router = useRouter();
  const isOS = mode === "os";
  const [form, setForm] = useState<DocForm>(initial);
  const [clientes, setClientes] = useState(clientesIniciais);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [equipAtivos, setEquipAtivos] = useState(initial.equipamentos.length > 0);
  const [clienteModal, setClienteModal] = useState<string | null>(null);
  const [equipModal, setEquipModal] = useState(false);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => setForm(initial), [initial]);

  /** Aplica uma mudança e mantém a duração da 1ª visita acompanhando a sugestão. */
  const update = useCallback(
    (fn: (f: DocForm) => DocForm) => {
      setFeedback(null);
      setForm((prev) => {
        const next = fn(prev);
        if (!isOS || next.visitas.length === 0 || !next.visitas[0].auto) return next;
        const sug = duracaoSugerida(next, padroes.duracao_visita_min);
        if (next.visitas[0].duracao_min === sug) return next;
        return { ...next, visitas: next.visitas.map((v, i) => (i === 0 ? { ...v, duracao_min: sug } : v)) };
      });
    },
    [isOS, padroes.duracao_visita_min],
  );
  const set = (patch: Partial<DocForm>) => update((f) => ({ ...f, ...patch }));

  // Equipamentos do cliente escolhido.
  const loadEquipamentos = useCallback(async (clienteId: string | null) => {
    if (!clienteId) return setEquipamentos([]);
    const { data } = await createClient().from("base_equipamentos").select("*").eq("cliente_id", clienteId).order("nome");
    setEquipamentos(data ?? []);
  }, []);
  useEffect(() => {
    void loadEquipamentos(form.cliente_id);
  }, [form.cliente_id, loadEquipamentos]);

  const t = totais(form);
  const cliente = clientes.find((c) => c.id === form.cliente_id) ?? null;
  const equipOptions = equipamentos.map((e) => ({ id: e.id, nome: `${e.nome} (${EQUIPAMENTO_CURTO[e.tipo]})` }));
  const catServicos = useMemo(
    () => servicos.map((s) => ({ id: s.id, nome: s.nome, codigo: s.codigo, valor: s.valor, tempo_min: s.tempo_medio_min })),
    [servicos],
  );
  const catProdutos = useMemo(
    () => produtos.map((p) => ({ id: p.id, nome: p.nome, codigo: p.codigo, valor: p.valor_venda, tempo_min: null })),
    [produtos],
  );
  const sugestao = duracaoSugerida(form, padroes.duracao_visita_min);
  const finalizado = isOS && form.status === "finalizado";
  const base = isOS ? "/servicos" : "/orcamentos";

  function afterSave(id: string, numero: number, text: string) {
    setFeedback({ kind: "ok", text });
    if (!form.id) {
      router.replace(`${base}/${id}`);
    } else {
      setForm((f) => ({ ...f, numero }));
      router.refresh();
    }
  }

  function salvar() {
    start(async () => {
      const r = isOS ? await salvarAtendimento(form) : await salvarOrcamento(form);
      if (!r.ok) return setFeedback({ kind: "error", text: r.error });
      afterSave(r.data.id, r.data.numero, isOS ? "Atendimento salvo." : "Orçamento salvo.");
    });
  }

  function finalizar() {
    start(async () => {
      const r = await finalizarAtendimento(form);
      if (!r.ok) return setFeedback({ kind: "error", text: r.error });
      const msg =
        r.data.status === "finalizado"
          ? "OS finalizada."
          : "OS concluída e marcada como Aguardando Pagamento.";
      setForm((f) => ({ ...f, status: r.data.status, data_entrega: f.data_entrega || todayISO() }));
      afterSave(r.data.id, r.data.numero, msg);
    });
  }

  function transformar() {
    start(async () => {
      const r = await transformarEmAtendimento(form);
      if (!r.ok) return setFeedback({ kind: "error", text: r.error });
      router.push(`/servicos/${r.data.osId}`);
    });
  }

  const titulo = form.id
    ? `${isOS ? "OS" : "Orçamento"} ${docNumber(form.numero)}`
    : isOS
      ? "Novo atendimento"
      : "Novo orçamento";

  const acoes = (
    <div className="grid gap-2">
      {feedback ? <Feedback kind={feedback.kind}>{feedback.text}</Feedback> : null}
      {isOS ? (
        <>
          {!finalizado ? (
            <Button variant="dark" onClick={finalizar} disabled={pending} icon={<CheckCircle2 />}>
              Finalizar OS
            </Button>
          ) : null}
          <Button variant={finalizado ? "dark" : "outline"} onClick={salvar} disabled={pending}>
            {pending ? "Salvando…" : "Salvar atendimento"}
          </Button>
        </>
      ) : (
        <>
          <Button variant="dark" onClick={salvar} disabled={pending}>
            {pending ? "Salvando…" : "Salvar orçamento"}
          </Button>
          {osGerada ? (
            <Link
              href={`/servicos/${osGerada.id}`}
              className="rounded-md bg-surface-muted px-3 py-2 text-center text-[13px] font-medium text-brand-ink"
            >
              Já virou o atendimento OS {docNumber(osGerada.numero)} →
            </Link>
          ) : (
            <Button variant="outline" onClick={transformar} disabled={pending}>
              Transformar em atendimento
            </Button>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={base}
          aria-label="Voltar"
          className="inline-grid size-10 place-items-center rounded-md border border-border bg-surface text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]">
            {titulo}
          </h1>
          <p className="text-[13px] text-ink-subtle">
            {cliente ? cliente.nome : form.id ? "Cliente não definido" : "Preencha os dados e salve"}
            {orcamentoOrigem ? ` · criado do orçamento ${docNumber(orcamentoOrigem.numero)}` : ""}
          </p>
        </div>
        {isOS && form.id ? <StatusBadge status={form.status} /> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid gap-4">
          {/* Dados principais */}
          <Card className="grid gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Field label={isOS ? "Número da OS" : "Número do orçamento"} required htmlFor="doc-num">
                  <Input
                    id="doc-num"
                    inputMode="numeric"
                    className="font-mono"
                    value={docNumber(form.numero)}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/\D/g, "").slice(-5));
                      set({ numero: n });
                    }}
                  />
                </Field>
              </div>
              <div className="sm:col-span-4">
                <Field label="Cliente" required htmlFor="doc-cliente">
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Combobox
                        id="doc-cliente"
                        items={clientes.map((c) => ({
                          id: c.id,
                          label: c.nome,
                          sublabel: [phone(c.telefone), c.bairro, c.cidade].filter(Boolean).join(" · "),
                          search: c.telefone,
                        }))}
                        valueLabel={cliente?.nome ?? ""}
                        placeholder="Buscar cliente pelo nome"
                        emptyText="Nenhum cliente encontrado"
                        freeLabel={(text) => `Cadastrar “${text}” como novo cliente`}
                        onFree={(text) => setClienteModal(text)}
                        onSelect={(item) => {
                          set({ cliente_id: item?.id ?? null, equipamentos: [] });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setClienteModal("")}
                      aria-label="Cadastrar cliente"
                      className="inline-grid size-11 shrink-0 place-items-center rounded-md border border-border text-ink-muted hover:bg-surface-muted lg:size-10"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={isOS ? "Data de início" : "Data"} required htmlFor="doc-data">
                  <Input id="doc-data" type="date" value={form.data} onChange={(e) => set({ data: e.target.value })} />
                </Field>
              </div>
              {isOS ? (
                <>
                  <div className="sm:col-span-2">
                    <Field label="Status" htmlFor="doc-status">
                      <Select
                        id="doc-status"
                        value={form.status}
                        onChange={(e) => set({ status: e.target.value as DocForm["status"] })}
                      >
                        {STATUS_OPCOES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Data da entrega" htmlFor="doc-entrega" hint="Vazia: preenche ao finalizar">
                      <Input
                        id="doc-entrega"
                        type="date"
                        value={form.data_entrega}
                        onChange={(e) => set({ data_entrega: e.target.value })}
                      />
                    </Field>
                  </div>
                </>
              ) : null}
            </div>
            <Field label="Relato do cliente" htmlFor="doc-relato">
              <Textarea
                id="doc-relato"
                placeholder="O que o cliente contou sobre o problema"
                value={form.relato}
                onChange={(e) => set({ relato: e.target.value })}
              />
            </Field>
          </Card>

          {/* Visitas técnicas */}
          {isOS ? (
            <CollapsibleSection
              title="Visitas técnicas"
              enabled={false}
              alwaysOn
              summary={`${form.visitas.length} ${form.visitas.length === 1 ? "visita" : "visitas"} · ${duration(
                form.visitas.reduce((s, v) => s + v.duracao_min, 0),
              )}`}
            >
              {form.visitas.map((v, i) => {
                const opcoes = DURACOES.includes(v.duracao_min)
                  ? DURACOES
                  : [...DURACOES, v.duracao_min].sort((a, b) => a - b);
                return (
                  <div key={v.key} className="grid gap-3 rounded-lg bg-surface-muted p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <Field label={`Visita ${i + 1}`} htmlFor={`${v.key}-data`}>
                      <Input
                        id={`${v.key}-data`}
                        type="date"
                        value={v.data}
                        onChange={(e) =>
                          update((f) => ({
                            ...f,
                            visitas: f.visitas.map((x) => (x.key === v.key ? { ...x, data: e.target.value } : x)),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Horário" htmlFor={`${v.key}-hora`}>
                      <Input
                        id={`${v.key}-hora`}
                        type="time"
                        value={v.hora}
                        onChange={(e) =>
                          update((f) => ({
                            ...f,
                            visitas: f.visitas.map((x) => (x.key === v.key ? { ...x, hora: e.target.value } : x)),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Duração" htmlFor={`${v.key}-dur`}>
                      <Select
                        id={`${v.key}-dur`}
                        value={v.duracao_min}
                        onChange={(e) =>
                          update((f) => ({
                            ...f,
                            visitas: f.visitas.map((x) =>
                              x.key === v.key ? { ...x, duracao_min: Number(e.target.value), auto: false } : x,
                            ),
                          }))
                        }
                      >
                        {opcoes.map((m) => (
                          <option key={m} value={m}>
                            {duration(m)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <button
                      type="button"
                      aria-label="Remover visita"
                      disabled={form.visitas.length === 1}
                      onClick={() => update((f) => ({ ...f, visitas: f.visitas.filter((x) => x.key !== v.key) }))}
                      className="inline-grid size-11 place-items-center rounded-md border border-border bg-surface text-ink-subtle hover:text-danger disabled:opacity-40 lg:size-10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus />}
                  onClick={() =>
                    update((f) => ({
                      ...f,
                      visitas: [
                        ...f.visitas,
                        { key: newKey(), data: todayISO(), hora: "", duracao_min: padroes.duracao_visita_min, auto: false },
                      ],
                    }))
                  }
                >
                  Adicionar visita
                </Button>
                {form.visitas[0] && !form.visitas[0].auto && form.visitas[0].duracao_min !== sugestao ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-ink"
                    onClick={() =>
                      update((f) => ({
                        ...f,
                        visitas: f.visitas.map((x, i) => (i === 0 ? { ...x, auto: true } : x)),
                      }))
                    }
                  >
                    Usar duração sugerida ({duration(sugestao)})
                  </button>
                ) : (
                  <span className="text-xs text-ink-subtle">Sugestão: visita padrão + tempo médio dos serviços</span>
                )}
              </div>
              <Field label="Distância (km)" htmlFor="doc-km" hint="Cálculo automático em breve; por enquanto, digite">
                <Input
                  id="doc-km"
                  inputMode="decimal"
                  className="sm:max-w-40"
                  value={form.distancia_km ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                    set({ distancia_km: v === "" ? null : Number(v) });
                  }}
                />
              </Field>
            </CollapsibleSection>
          ) : null}

          {/* Equipamentos */}
          {isOS ? (
            <CollapsibleSection
              title="Equipamentos"
              enabled={equipAtivos}
              onEnabledChange={(v) => {
                setEquipAtivos(v);
                if (!v) set({ equipamentos: [] });
              }}
              summary={
                form.equipamentos.length
                  ? `${form.equipamentos.length} ${form.equipamentos.length === 1 ? "equipamento" : "equipamentos"}`
                  : "Nenhum equipamento"
              }
            >
              {!form.cliente_id ? (
                <p className="text-[13px] text-ink-subtle">Escolha o cliente para ver os equipamentos dele.</p>
              ) : (
                <>
                  {equipamentos.length === 0 ? (
                    <p className="text-[13px] text-ink-subtle">Este cliente ainda não tem equipamentos cadastrados.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {equipamentos.map((e) => {
                        const on = form.equipamentos.includes(e.id);
                        return (
                          <div
                            key={e.id}
                            className={cn(
                              "rounded-lg border px-3 py-2.5",
                              on ? "border-brand-700 bg-brand-100" : "border-border",
                            )}
                          >
                            <Checkbox
                              checked={on}
                              onChange={(v) =>
                                set({
                                  equipamentos: v
                                    ? [...form.equipamentos, e.id]
                                    : form.equipamentos.filter((x) => x !== e.id),
                                })
                              }
                              label={
                                <span>
                                  <span className="block font-medium">{e.nome}</span>
                                  <span className="block text-xs text-ink-subtle">{EQUIPAMENTO_CURTO[e.tipo]}</span>
                                </span>
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" icon={<Plus />} onClick={() => setEquipModal(true)}>
                      Novo equipamento
                    </Button>
                  </div>
                </>
              )}
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            title="Serviços"
            enabled={form.servicos_ativos}
            onEnabledChange={(v) =>
              update((f) => ({
                ...f,
                servicos_ativos: v,
                servicos:
                  v && f.servicos.length === 0
                    ? [
                        {
                          key: newKey(),
                          catalogId: null,
                          descricao: "",
                          quantidade: 1,
                          valor_unitario: 0,
                          equipamento_id: null,
                          tempo_min: null,
                        },
                      ]
                    : f.servicos,
              }))
            }
            summary={form.servicos_ativos && form.servicos.length ? money(t.servicos) : "Nenhum serviço"}
          >
            <ItemList
              kind="servico"
              itens={form.servicos}
              onChange={(servicos) => update((f) => ({ ...f, servicos }))}
              catalogo={catServicos}
              equipamentos={equipOptions}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Produtos"
            enabled={form.produtos_ativos}
            onEnabledChange={(v) =>
              update((f) => ({
                ...f,
                produtos_ativos: v,
                produtos:
                  v && f.produtos.length === 0
                    ? [
                        {
                          key: newKey(),
                          catalogId: null,
                          descricao: "",
                          quantidade: 1,
                          valor_unitario: 0,
                          equipamento_id: null,
                          tempo_min: null,
                        },
                      ]
                    : f.produtos,
              }))
            }
            summary={form.produtos_ativos && form.produtos.length ? money(t.produtos) : "Nenhum produto"}
          >
            <ItemList
              kind="produto"
              itens={form.produtos}
              onChange={(produtos) => update((f) => ({ ...f, produtos }))}
              catalogo={catProdutos}
              equipamentos={equipOptions}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Despesas"
            enabled={form.despesas_ativas}
            onEnabledChange={(v) => set({ despesas_ativas: v })}
            summary={form.despesas_ativas ? money(t.despesas) : "Sem despesas"}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Deslocamento" htmlFor="dsp-desl">
                <MoneyInput id="dsp-desl" value={form.despesa_deslocamento} onChange={(v) => set({ despesa_deslocamento: v })} />
              </Field>
              <Field label="Alimentação" htmlFor="dsp-alim">
                <MoneyInput id="dsp-alim" value={form.despesa_alimentacao} onChange={(v) => set({ despesa_alimentacao: v })} />
              </Field>
              <Field label="Insumos" htmlFor="dsp-ins">
                <MoneyInput id="dsp-ins" value={form.despesa_insumos} onChange={(v) => set({ despesa_insumos: v })} />
              </Field>
              <Field label="Outros" htmlFor="dsp-out">
                <MoneyInput id="dsp-out" value={form.despesa_outros} onChange={(v) => set({ despesa_outros: v })} />
              </Field>
            </div>
          </CollapsibleSection>

          {isOS ? (
            <CollapsibleSection
              title="Recebimento"
              enabled={form.recebido}
              onEnabledChange={(v) =>
                set({ recebido: v, valor_recebido: v ? (form.valor_recebido ?? t.total) : form.valor_recebido })
              }
              summary={form.recebido ? money(form.valor_recebido ?? t.total) : "Não recebido"}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Data do recebimento" htmlFor="rec-data" hint="Data futura: fica Aguardando Pagamento até o dia">
                  <Input
                    id="rec-data"
                    type="date"
                    value={form.data_recebimento}
                    onChange={(e) => set({ data_recebimento: e.target.value })}
                  />
                </Field>
                <Field
                  label="Valor recebido"
                  htmlFor="rec-valor"
                  hint={
                    form.valor_recebido !== null && form.valor_recebido < t.total
                      ? `Parcial: faltam ${money(t.total - form.valor_recebido)}`
                      : undefined
                  }
                >
                  <MoneyInput id="rec-valor" value={form.valor_recebido ?? t.total} onChange={(v) => set({ valor_recebido: v })} />
                </Field>
              </div>
            </CollapsibleSection>
          ) : null}

          <Card className="p-5">
            <Field label="Observações" htmlFor="doc-obs" hint="Saem no PDF">
              <Textarea id="doc-obs" value={form.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
            </Field>
          </Card>
        </div>

        {/* Resumo de valores */}
        <aside className="grid gap-4 lg:sticky lg:top-6">
          <Card className="grid gap-2.5 p-5">
            <h2 className="mb-1 text-sm font-semibold">Resumo</h2>
            <Linha label={`Serviços (${form.servicos_ativos ? form.servicos.length : 0})`} valor={t.servicos} apagado={form.valor_total_manual} />
            <Linha label={`Produtos (${form.produtos_ativos ? form.produtos.length : 0})`} valor={t.produtos} apagado={form.valor_total_manual} />
            <Linha label="Despesas" valor={t.despesas} apagado={form.valor_total_manual} />
            <div className="flex items-center justify-between gap-2 text-sm text-ink-muted">
              <Switch checked={form.cobrar_visita} onChange={(v) => set({ cobrar_visita: v })} label="Visita técnica" />
              <span className={cn("font-medium text-ink tabular-nums", (!form.cobrar_visita || form.valor_total_manual) && "text-ink-subtle")}>
                {money(form.valor_visita)}
              </span>
            </div>
            {form.cobrar_visita ? (
              <MoneyInput aria-label="Valor da visita" value={form.valor_visita} onChange={(v) => set({ valor_visita: v })} />
            ) : null}
            <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-border pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-[28px] leading-8 font-semibold tracking-[-0.02em] tabular-nums">{money(t.total)}</span>
            </div>
            <Switch
              checked={form.valor_total_manual}
              onChange={(v) => set({ valor_total_manual: v, valor_total: v ? t.calculado : form.valor_total })}
              label={<span className="text-[13px] text-ink-muted">Definir total manualmente</span>}
            />
            {form.valor_total_manual ? (
              <>
                <MoneyInput aria-label="Total manual" value={form.valor_total} onChange={(v) => set({ valor_total: v })} />
                <p className="text-xs text-ink-subtle">No PDF sai só o total; itens e despesas sem valores.</p>
              </>
            ) : null}
            {isOS && form.recebido ? (
              <>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <span
                    className="block h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, t.total > 0 ? ((form.valor_recebido ?? t.total) / t.total) * 100 : 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[13px] text-ink-muted">
                  Recebido
                  <strong className="font-medium text-ink tabular-nums">{money(form.valor_recebido ?? t.total)}</strong>
                </div>
              </>
            ) : null}
          </Card>
          <div className="hidden lg:block">{acoes}</div>
        </aside>
      </div>

      {/* Celular: ações no fim da página */}
      <div className="mt-4 lg:hidden">{acoes}</div>

      <ClienteModal
        open={clienteModal !== null}
        nomeInicial={clienteModal ?? ""}
        onClose={() => setClienteModal(null)}
        onSaved={(c) => {
          setClienteModal(null);
          setClientes((list) => [
            ...list.filter((x) => x.id !== c.id),
            { id: c.id, nome: c.nome, telefone: c.telefone, bairro: c.bairro, cidade: c.cidade },
          ]);
          set({ cliente_id: c.id, equipamentos: [] });
        }}
      />

      {form.cliente_id ? (
        <EquipamentoModal
          open={equipModal}
          onClose={() => setEquipModal(false)}
          clienteId={form.cliente_id}
          onSaved={(e) => {
            setEquipModal(false);
            setEquipamentos((list) => [...list, e]);
            set({ equipamentos: [...form.equipamentos, e.id] });
          }}
        />
      ) : null}
    </>
  );
}

function Linha({ label, valor, apagado }: { label: string; valor: number; apagado: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-sm text-ink-muted">
      {label}
      <strong className={cn("font-medium tabular-nums", apagado ? "text-ink-subtle" : "text-ink")}>{money(valor)}</strong>
    </div>
  );
}

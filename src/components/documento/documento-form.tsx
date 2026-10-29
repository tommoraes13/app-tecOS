"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { finalizarAtendimento, salvarAtendimento, vincularEquipamento } from "@/app/(app)/servicos/actions";
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
import { useI18n } from "@/i18n/client";
import { docNumber, duration, phone } from "@/lib/format";
import { DURACOES, EQUIPAMENTO_CURTO } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { asSpecs, fichaEquipamento } from "@/lib/equipamentos";
import { ItemList } from "./item-list";
import { GuardaSaida } from "./guarda-saida";
import { PdfActions } from "./pdf-actions";
import { WhatsappButton } from "./whatsapp-button";

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
  const { t, fmt } = useI18n();
  const { money } = fmt;
  const router = useRouter();
  const isOS = mode === "os";
  const [form, setForm] = useState<DocForm>(initial);
  const [clientes, setClientes] = useState(clientesIniciais);
  const [busca, setBusca] = useState<ClienteOpcao[]>(clientesIniciais);

  // Clientes buscados no banco conforme você digita (não carrega a lista inteira).
  const buscaSeq = useRef(0);
  const buscarClientes = useCallback((q: string) => {
    const seq = ++buscaSeq.current;
    window.setTimeout(async () => {
      if (seq !== buscaSeq.current) return;
      const { data } = await createClient().rpc("buscar_clientes", { p_q: q, p_limite: 20 });
      if (seq === buscaSeq.current) setBusca((data ?? []) as ClienteOpcao[]);
    }, q ? 250 : 0);
  }, []);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [equipAtivos, setEquipAtivos] = useState(initial.equipamentos.length > 0);
  const [clienteModal, setClienteModal] = useState<string | null>(null);
  const [equipModal, setEquipModal] = useState(false);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // Importante: o formulário NÃO volta para `initial` quando a página recarrega dados do servidor;
  // senão o que foi preenchido (cliente novo, equipamento novo) se perde.
  const [descontoAtivo, setDescontoAtivo] = useState(initial.desconto_valor > 0);

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

  const tot = totais(form);
  const cliente = clientes.find((c) => c.id === form.cliente_id) ?? null;
  const equipOptions = equipamentos.map((e) => ({ id: e.id, nome: `${e.nome} (${t(EQUIPAMENTO_CURTO[e.tipo])})` }));
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

  // O que está salvo no banco, para avisar "Salvar antes de sair?" quando houver mudanças.
  const salvoRef = useRef(JSON.stringify(initial));
  const alterado = JSON.stringify(form) !== salvoRef.current;

  /** Salva sem mudar de tela (usado pelo aviso de saída). */
  async function salvarParaSair() {
    const enviado = form;
    const r = isOS ? await salvarAtendimento(enviado) : await salvarOrcamento(enviado);
    if (!r.ok) {
      setFeedback({ kind: "error", text: t(r.error) });
      return false;
    }
    salvoRef.current = JSON.stringify({ ...enviado, numero: r.data.numero });
    return true;
  }

  function salvar() {
    const enviado = form;
    start(async () => {
      const r = isOS ? await salvarAtendimento(enviado) : await salvarOrcamento(enviado);
      if (!r.ok) return setFeedback({ kind: "error", text: t(r.error) });
      salvoRef.current = JSON.stringify({ ...enviado, numero: r.data.numero });
      afterSave(r.data.id, r.data.numero, isOS ? t("Atendimento salvo.") : t("Orçamento salvo."));
    });
  }

  function finalizar() {
    const enviado = form;
    start(async () => {
      const r = await finalizarAtendimento(enviado);
      if (!r.ok) return setFeedback({ kind: "error", text: t(r.error) });
      salvoRef.current = JSON.stringify({
        ...enviado,
        numero: r.data.numero,
        status: r.data.status,
        data_entrega: enviado.data_entrega || fmt.today(),
      });
      const msg =
        r.data.status === "finalizado" ? t("OS finalizada.") : t("OS concluída e marcada como Aguardando Pagamento.");
      setForm((f) => ({ ...f, status: r.data.status, data_entrega: f.data_entrega || fmt.today() }));
      afterSave(r.data.id, r.data.numero, msg);
    });
  }

  function transformar() {
    start(async () => {
      const enviado = form;
      const r = await transformarEmAtendimento(enviado);
      if (!r.ok) return setFeedback({ kind: "error", text: t(r.error) });
      salvoRef.current = JSON.stringify(enviado);
      router.push(`/servicos/${r.data.osId}`);
    });
  }

  const titulo = form.id
    ? isOS
      ? t("OS {n}", { n: docNumber(form.numero) })
      : t("Orçamento {n}", { n: docNumber(form.numero) })
    : isOS
      ? t("Novo atendimento")
      : t("Novo orçamento");

  const acoes = (
    <div className="grid gap-2">
      {feedback ? <Feedback kind={feedback.kind}>{feedback.text}</Feedback> : null}
      {form.id ? <PdfActions tipo={mode} id={form.id} numero={form.numero} /> : null}
      {form.id ? <WhatsappButton tipo={mode} id={form.id} className="mb-1" /> : null}
      {isOS ? (
        <>
          {!finalizado ? (
            <Button variant="dark" onClick={finalizar} disabled={pending} icon={<CheckCircle2 />}>
              {t("Finalizar OS")}
            </Button>
          ) : null}
          <Button variant={finalizado ? "dark" : "outline"} onClick={salvar} disabled={pending}>
            {pending ? t("Salvando…") : t("Salvar atendimento")}
          </Button>
        </>
      ) : (
        <>
          <Button variant="dark" onClick={salvar} disabled={pending}>
            {pending ? t("Salvando…") : t("Salvar orçamento")}
          </Button>
          {osGerada ? (
            <Link
              href={`/servicos/${osGerada.id}`}
              className="rounded-md bg-surface-muted px-3 py-2 text-center text-[13px] font-medium text-brand-ink"
            >
              {t("Já virou o atendimento OS {n} →", { n: docNumber(osGerada.numero) })}
            </Link>
          ) : (
            <Button variant="outline" onClick={transformar} disabled={pending}>
              {t("Transformar em atendimento")}
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
          aria-label={t("Voltar")}
          className="inline-grid size-10 place-items-center rounded-md border border-border bg-surface text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]">
            {titulo}
          </h1>
          <p className="text-[13px] text-ink-subtle">
            {cliente ? cliente.nome : form.id ? t("Cliente não definido") : t("Preencha os dados e salve")}
            {orcamentoOrigem ? ` · ${t("criado do orçamento {n}", { n: docNumber(orcamentoOrigem.numero) })}` : ""}
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
                <Field label={isOS ? t("Número da OS") : t("Número do orçamento")} required htmlFor="doc-num">
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
                <Field label={t("Cliente")} required htmlFor="doc-cliente">
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1">
                      <Combobox
                        id="doc-cliente"
                        items={busca.map((c) => ({
                          id: c.id,
                          label: c.nome,
                          sublabel: [phone(c.telefone), c.bairro, c.cidade].filter(Boolean).join(" · "),
                          search: c.telefone,
                        }))}
                        valueLabel={cliente?.nome ?? ""}
                        onQueryChange={buscarClientes}
                        placeholder={t("Buscar cliente pelo nome")}
                        emptyText={t("Nenhum cliente encontrado")}
                        freeLabel={(text) => t("Cadastrar “{nome}” como novo cliente", { nome: text })}
                        onFree={(text) => setClienteModal(text)}
                        onSelect={(item) => {
                          const escolhido = item ? busca.find((c) => c.id === item.id) : null;
                          if (escolhido) setClientes((list) => [...list.filter((x) => x.id !== escolhido.id), escolhido]);
                          set({ cliente_id: item?.id ?? null, equipamentos: [] });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setClienteModal("")}
                      aria-label={t("Cadastrar cliente")}
                      className="inline-grid size-11 shrink-0 place-items-center rounded-md border border-border text-ink-muted hover:bg-surface-muted lg:size-10"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={isOS ? t("Data de início") : t("Data")} required htmlFor="doc-data">
                  <Input id="doc-data" type="date" value={form.data} onChange={(e) => set({ data: e.target.value })} />
                </Field>
              </div>
              {isOS ? (
                <>
                  <div className="sm:col-span-2">
                    <Field label={t("Status")} htmlFor="doc-status">
                      <Select
                        id="doc-status"
                        value={form.status}
                        onChange={(e) => {
                          const status = e.target.value as DocForm["status"];
                          // Regra: Finalizado já conta como recebido hoje (pode ajustar na seção Recebimento).
                          if (status === "finalizado" && !form.recebido) {
                            set({
                              status,
                              recebido: true,
                              valor_recebido: form.valor_recebido ?? tot.total,
                              data_recebimento: fmt.today(),
                              data_entrega: form.data_entrega || fmt.today(),
                            });
                          } else set({ status });
                        }}
                      >
                        {STATUS_OPCOES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {t(s.label)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label={t("Data da entrega")} htmlFor="doc-entrega" hint={t("Vazia: preenche ao finalizar")}>
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
            <Field label={t("Relato do cliente")} htmlFor="doc-relato">
              <Textarea
                id="doc-relato"
                placeholder={t("O que o cliente contou sobre o problema")}
                value={form.relato}
                onChange={(e) => set({ relato: e.target.value })}
              />
            </Field>
          </Card>

          {/* Visitas técnicas */}
          {isOS ? (
            <CollapsibleSection
              title={t("Visitas técnicas")}
              enabled={false}
              alwaysOn
              summary={`${form.visitas.length === 1 ? t("1 visita") : t("{n} visitas", { n: form.visitas.length })} · ${duration(
                form.visitas.reduce((s, v) => s + v.duracao_min, 0),
              )}`}
            >
              {form.visitas.map((v, i) => {
                const opcoes = DURACOES.includes(v.duracao_min)
                  ? DURACOES
                  : [...DURACOES, v.duracao_min].sort((a, b) => a - b);
                return (
                  <div key={v.key} className="grid gap-3 rounded-lg bg-surface-muted p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <Field label={t("Visita {n}", { n: i + 1 })} htmlFor={`${v.key}-data`}>
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
                    <Field label={t("Horário")} htmlFor={`${v.key}-hora`}>
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
                    <Field label={t("Duração")} htmlFor={`${v.key}-dur`}>
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
                      aria-label={t("Remover visita")}
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
                        { key: newKey(), data: fmt.today(), hora: "", duracao_min: padroes.duracao_visita_min, auto: false },
                      ],
                    }))
                  }
                >
                  {t("Adicionar visita")}
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
                    {t("Usar duração sugerida ({tempo})", { tempo: duration(sugestao) })}
                  </button>
                ) : (
                  <span className="text-xs text-ink-subtle">{t("Sugestão: visita padrão + tempo médio dos serviços")}</span>
                )}
              </div>
              <Field label={t("Distância (km)")} htmlFor="doc-km" hint={t("Cálculo automático em breve; por enquanto, digite")}>
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
              title={t("Equipamentos")}
              enabled={equipAtivos}
              onEnabledChange={(v) => {
                setEquipAtivos(v);
                if (!v) set({ equipamentos: [] });
              }}
              summary={
                form.equipamentos.length
                  ? form.equipamentos.length === 1
                    ? t("1 equipamento")
                    : t("{n} equipamentos", { n: form.equipamentos.length })
                  : t("Nenhum equipamento")
              }
            >
              {!form.cliente_id ? (
                <p className="text-[13px] text-ink-subtle">{t("Escolha o cliente para ver os equipamentos dele.")}</p>
              ) : (
                <>
                  {equipamentos.length === 0 ? (
                    <p className="text-[13px] text-ink-subtle">{t("Este cliente ainda não tem equipamentos cadastrados.")}</p>
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
                                <span className="min-w-0">
                                  <span className="block font-medium">
                                    {e.nome} <span className="font-normal text-ink-subtle">· {t(EQUIPAMENTO_CURTO[e.tipo])}</span>
                                  </span>
                                  {fichaEquipamento(e.tipo, asSpecs(e.especificacoes), t) ? (
                                    <span className="block text-xs text-ink-subtle">
                                      {fichaEquipamento(e.tipo, asSpecs(e.especificacoes), t)}
                                    </span>
                                  ) : null}
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
                      {t("Novo equipamento")}
                    </Button>
                  </div>
                </>
              )}
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            title={t("Serviços")}
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
            summary={form.servicos_ativos && form.servicos.length ? money(tot.servicos) : t("Nenhum serviço")}
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
            title={t("Produtos")}
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
            summary={form.produtos_ativos && form.produtos.length ? money(tot.produtos) : t("Nenhum produto")}
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
            title={t("Despesas")}
            enabled={form.despesas_ativas}
            onEnabledChange={(v) => set({ despesas_ativas: v })}
            summary={
              form.despesas_ativas
                ? [
                    tot.frete ? t("Frete {valor}", { valor: money(tot.frete) }) : null,
                    tot.interno ? t("Internas {valor}", { valor: money(tot.interno) }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("Nenhum valor")
                : t("Sem despesas")
            }
          >
            <Field label={t("Frete")} htmlFor="dsp-frete" hint={t("Cobrado do cliente: entra no total e aparece no PDF")}>
              <MoneyInput id="dsp-frete" value={form.despesa_frete} onChange={(v) => set({ despesa_frete: v })} />
            </Field>
            <div className="rounded-lg bg-surface-muted p-3">
              <p className="mb-3 text-xs text-ink-subtle">
                {t("Custos internos: ficam só no seu controle financeiro. Não entram no total cobrado nem aparecem para o cliente.")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("Deslocamento")} htmlFor="dsp-desl">
                  <MoneyInput id="dsp-desl" value={form.despesa_deslocamento} onChange={(v) => set({ despesa_deslocamento: v })} />
                </Field>
                <Field label={t("Alimentação")} htmlFor="dsp-alim">
                  <MoneyInput id="dsp-alim" value={form.despesa_alimentacao} onChange={(v) => set({ despesa_alimentacao: v })} />
                </Field>
                <Field label={t("Insumos")} htmlFor="dsp-ins">
                  <MoneyInput id="dsp-ins" value={form.despesa_insumos} onChange={(v) => set({ despesa_insumos: v })} />
                </Field>
                <Field label={t("Outros")} htmlFor="dsp-out">
                  <MoneyInput id="dsp-out" value={form.despesa_outros} onChange={(v) => set({ despesa_outros: v })} />
                </Field>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={t("Desconto")}
            enabled={descontoAtivo}
            onEnabledChange={(v) => {
              setDescontoAtivo(v);
              if (!v) set({ desconto_valor: 0 });
            }}
            summary={tot.desconto ? `− ${money(tot.desconto)}` : t("Sem desconto")}
          >
            <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
              <div className="inline-flex h-11 rounded-full bg-surface-muted p-1 lg:h-10" role="radiogroup" aria-label={t("Tipo de desconto")}>
                {(["valor", "percentual"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    role="radio"
                    aria-checked={form.desconto_tipo === tipo}
                    onClick={() => set({ desconto_tipo: tipo, desconto_valor: 0 })}
                    className={cn(
                      "rounded-full px-4 text-sm font-medium",
                      form.desconto_tipo === tipo ? "bg-surface text-ink shadow-card" : "text-ink-muted",
                    )}
                  >
                    {tipo === "valor" ? fmt.currencySymbol : "%"}
                  </button>
                ))}
              </div>
              {form.desconto_tipo === "valor" ? (
                <Field label={t("Valor do desconto")} htmlFor="desc-valor">
                  <MoneyInput id="desc-valor" value={form.desconto_valor} onChange={(v) => set({ desconto_valor: v })} />
                </Field>
              ) : (
                <Field
                  label={t("Porcentagem")}
                  htmlFor="desc-pct"
                  hint={tot.desconto ? t("Equivale a {valor}", { valor: money(tot.desconto) }) : undefined}
                >
                  <Input
                    id="desc-pct"
                    inputMode="decimal"
                    value={form.desconto_valor ? String(form.desconto_valor).replace(".", ",") : ""}
                    placeholder={t("Exemplo: 10")}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""));
                      set({ desconto_valor: Number.isFinite(n) ? Math.min(100, n) : 0 });
                    }}
                  />
                </Field>
              )}
            </div>
          </CollapsibleSection>

          {isOS ? (
            <CollapsibleSection
              title={t("Recebimento")}
              enabled={form.recebido}
              onEnabledChange={(v) =>
                set({ recebido: v, valor_recebido: v ? (form.valor_recebido ?? tot.total) : form.valor_recebido })
              }
              summary={form.recebido ? money(form.valor_recebido ?? tot.total) : t("Não recebido")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("Data do recebimento")} htmlFor="rec-data" hint={t("Data futura: fica Aguardando Pagamento até o dia")}>
                  <Input
                    id="rec-data"
                    type="date"
                    value={form.data_recebimento}
                    onChange={(e) => set({ data_recebimento: e.target.value })}
                  />
                </Field>
                <Field
                  label={t("Valor recebido")}
                  htmlFor="rec-valor"
                  hint={
                    form.valor_recebido !== null && form.valor_recebido < tot.total
                      ? t("Parcial: faltam {valor}", { valor: money(tot.total - form.valor_recebido) })
                      : undefined
                  }
                >
                  <MoneyInput id="rec-valor" value={form.valor_recebido ?? tot.total} onChange={(v) => set({ valor_recebido: v })} />
                </Field>
              </div>
            </CollapsibleSection>
          ) : null}

          <Card className="grid gap-4 p-5">
            <Field
              label={t("Garantia")}
              htmlFor="doc-garantia"
              hint={isOS ? t("Conta a partir da data da entrega") : t("Vale a partir da entrega do serviço")}
            >
              <Select
                id="doc-garantia"
                className="sm:max-w-60"
                value={form.garantia_meses ?? 0}
                onChange={(e) => set({ garantia_meses: Number(e.target.value) || null })}
              >
                {[...new Set([0, 1, 2, 3, 6, 12, 18, 24, form.garantia_meses ?? 0])]
                  .sort((a, b) => a - b)
                  .map((m) => (
                    <option key={m} value={m}>
                      {m === 0 ? t("Sem garantia") : m === 1 ? t("1 mês") : t("{n} meses", { n: m })}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label={t("Observações")} htmlFor="doc-obs" hint={t("Saem no PDF")}>
              <Textarea id="doc-obs" value={form.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
            </Field>
          </Card>
        </div>

        {/* Resumo de valores */}
        <aside className="grid gap-4 lg:sticky lg:top-6">
          <Card className="grid gap-2.5 p-5">
            <h2 className="mb-1 text-sm font-semibold">{t("Resumo")}</h2>
            <Linha label={t("Serviços ({n})", { n: form.servicos_ativos ? form.servicos.length : 0 })} valor={tot.servicos} apagado={form.valor_total_manual} />
            <Linha label={t("Produtos ({n})", { n: form.produtos_ativos ? form.produtos.length : 0 })} valor={tot.produtos} apagado={form.valor_total_manual} />
            {tot.frete ? <Linha label={t("Frete")} valor={tot.frete} apagado={form.valor_total_manual} /> : null}
            <div className="flex items-center justify-between gap-2 text-sm text-ink-muted">
              <Switch checked={form.cobrar_visita} onChange={(v) => set({ cobrar_visita: v })} label={t("Visita técnica")} />
              <span className={cn("font-medium text-ink tabular-nums", (!form.cobrar_visita || form.valor_total_manual) && "text-ink-subtle")}>
                {money(form.valor_visita)}
              </span>
            </div>
            {form.cobrar_visita ? (
              <MoneyInput aria-label={t("Valor da visita")} value={form.valor_visita} onChange={(v) => set({ valor_visita: v })} />
            ) : null}
            {tot.desconto ? (
              <div className="flex justify-between gap-2 text-sm text-ink-muted">
                {t("Desconto")}
                {form.desconto_tipo === "percentual" ? ` (${fmt.number(form.desconto_valor, 2)}%)` : ""}
                <strong className={cn("font-medium tabular-nums", form.valor_total_manual ? "text-ink-subtle" : "text-success")}>
                  − {money(tot.desconto)}
                </strong>
              </div>
            ) : null}
            <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-border pt-3">
              <span className="font-semibold">{t("Total")}</span>
              <span className="text-[28px] leading-8 font-semibold tracking-[-0.02em] tabular-nums">{money(tot.total)}</span>
            </div>
            <Switch
              checked={form.valor_total_manual}
              onChange={(v) => set({ valor_total_manual: v, valor_total: v ? tot.calculado : form.valor_total })}
              label={<span className="text-[13px] text-ink-muted">{t("Definir total manualmente")}</span>}
            />
            {form.valor_total_manual ? (
              <>
                <MoneyInput aria-label={t("Total manual")} value={form.valor_total} onChange={(v) => set({ valor_total: v })} />
                <p className="text-xs text-ink-subtle">{t("No PDF sai só o total; os itens aparecem sem valores.")}</p>
              </>
            ) : null}
            {tot.interno ? (
              <p className="text-xs text-ink-subtle">{t("Custos internos (não cobrados): {valor}", { valor: money(tot.interno) })}</p>
            ) : null}
            {isOS && form.recebido ? (
              <>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <span
                    className="block h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, tot.total > 0 ? ((form.valor_recebido ?? tot.total) / tot.total) * 100 : 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[13px] text-ink-muted">
                  {t("Recebido")}
                  <strong className="font-medium text-ink tabular-nums">{money(form.valor_recebido ?? tot.total)}</strong>
                </div>
              </>
            ) : null}
          </Card>
          <div className="hidden lg:block">{acoes}</div>
        </aside>
      </div>

      {/* Celular: ações no fim da página */}
      <div className="mt-4 pb-20 lg:hidden">{acoes}</div>

      {/* Celular: barra fixa com o total e o botão de salvar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-pop lg:hidden">
        <div className="min-w-0 flex-1">
          <span className="block text-xs text-ink-subtle">{t("Total")}</span>
          <span className="block truncate text-lg leading-6 font-semibold tabular-nums">{money(tot.total)}</span>
        </div>
        <Button variant="dark" onClick={salvar} disabled={pending}>
          {pending ? t("Salvando…") : isOS ? t("Salvar atendimento") : t("Salvar orçamento")}
        </Button>
      </div>

      <GuardaSaida alterado={alterado} salvar={salvarParaSair} />

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
            setEquipAtivos(true);
            setEquipamentos((list) => [...list.filter((x) => x.id !== e.id), e]);
            update((f) => ({ ...f, equipamentos: f.equipamentos.includes(e.id) ? f.equipamentos : [...f.equipamentos, e.id] }));
            // OS já salva: liga o equipamento na hora, sem precisar clicar em Salvar.
            if (isOS && form.id) {
              const osId = form.id;
              void vincularEquipamento(osId, e.id).then((r) =>
                setFeedback(r.ok ? { kind: "ok", text: t("Equipamento “{nome}” adicionado a esta OS.", { nome: e.nome }) } : { kind: "error", text: t(r.error) }),
              );
            }
          }}
        />
      ) : null}
    </>
  );
}

function Linha({ label, valor, apagado }: { label: string; valor: number; apagado: boolean }) {
  const { fmt } = useI18n();
  return (
    <div className="flex justify-between gap-2 text-sm text-ink-muted">
      {label}
      <strong className={cn("font-medium tabular-nums", apagado ? "text-ink-subtle" : "text-ink")}>{fmt.money(valor)}</strong>
    </div>
  );
}

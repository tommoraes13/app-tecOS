"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Wrench } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog, Drawer } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { OS_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { PillTabs } from "@/components/ui/tabs";
import type { Enums } from "@/lib/database.types";
import { STATUS_OPCOES } from "@/lib/documento";
import { date, docNumber, money, normalize, phone, relativeDays, whatsappLink } from "@/lib/format";
import { CATEGORIA_LABEL } from "@/lib/labels";
import { alterarStatus, excluirAtendimentos } from "./actions";

export type OsLinha = {
  id: string;
  numero: number;
  status: Enums<"os_status">;
  data_inicio: string;
  data_entrega: string | null;
  valor_total: number;
  valor_recebido: number | null;
  recebido: boolean;
  data_recebimento: string | null;
  cliente_id: string | null;
  relato: string | null;
  cliente: string | null;
  telefone: string | null;
  servicos: string[];
  categorias: string[];
};

type Aba = Enums<"os_status"> | "todos";

export function ServicosList({ linhas }: { linhas: OsLinha[] }) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("todos");
  const [q, setQ] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [categoria, setCategoria] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const term = normalize(q);
    const digits = q.replace(/\D/g, "");
    return linhas.filter((o) => {
      if (de && o.data_inicio < de) return false;
      if (ate && o.data_inicio > ate) return false;
      if (categoria && !o.categorias.includes(categoria)) return false;
      if (!term) return true;
      return (
        normalize(`${o.cliente ?? ""} ${o.relato ?? ""} ${o.servicos.join(" ")}`).includes(term) ||
        (digits.length > 0 && String(o.numero).includes(String(Number(digits))))
      );
    });
  }, [linhas, q, de, ate, categoria]);

  const list = aba === "todos" ? filtradas : filtradas.filter((o) => o.status === aba);
  const count = (s: Enums<"os_status">) => filtradas.filter((o) => o.status === s).length;
  const recentes = linhas.slice(0, 5);
  const aberto = linhas.find((o) => o.id === openId) ?? null;

  function remove(ids: string[]) {
    start(async () => {
      const r = await excluirAtendimentos(ids);
      if (!r.ok) return setError(r.error);
      setConfirm(null);
      setSelected(new Set());
      setOpenId(null);
      router.refresh();
    });
  }

  function mudarStatus(id: string, status: Enums<"os_status">) {
    start(async () => {
      const r = await alterarStatus(id, status);
      if (r.ok) router.refresh();
    });
  }

  const filtrosAtivos = Boolean(de || ate || categoria);

  return (
    <>
      <PageHeader
        title="Serviços Prestados"
        description={`${linhas.length} ${linhas.length === 1 ? "atendimento" : "atendimentos"} · ${count("em_andamento")} em andamento`}
        actions={
          <ButtonLink href="/servicos/novo" variant="cta" icon={<Plus />}>
            Novo atendimento
          </ButtonLink>
        }
      />

      {recentes.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-[15px] font-semibold">Mais recentes</h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {recentes.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOpenId(o.id)}
                className="flex w-56 shrink-0 snap-start flex-col gap-2 rounded-xl bg-surface p-4 text-left shadow-card hover:shadow-pop lg:w-auto"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink-subtle">OS {docNumber(o.numero)}</span>
                  <span className="text-xs text-ink-subtle">{relativeDays(o.data_inicio)}</span>
                </span>
                <span className="truncate font-medium">{o.cliente ?? "Cliente não definido"}</span>
                <span className="line-clamp-1 text-xs text-ink-subtle">{o.servicos.join(", ") || o.relato || "—"}</span>
                <span className="mt-auto flex items-center justify-between gap-2">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold tabular-nums">{money(o.valor_total, { noCents: true })}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <Card>
        <div className="grid gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillTabs
              value={aba}
              onChange={setAba}
              items={[
                { value: "todos", label: "Todos", count: filtradas.length },
                ...STATUS_OPCOES.map((s) => ({ value: s.value, label: s.label, count: count(s.value) })),
              ]}
            />
            <SearchInput value={q} onChange={setQ} placeholder="Cliente, serviço ou nº" className="w-full sm:w-72" />
          </div>
          <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,200px))_auto] sm:items-end">
            <Field label="De" htmlFor="f-de">
              <Input id="f-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </Field>
            <Field label="Até" htmlFor="f-ate">
              <Input id="f-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </Field>
            <Field label="Tipo de serviço" htmlFor="f-cat">
              <Select id="f-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todos os tipos</option>
                {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            {filtrosAtivos ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setDe("");
                  setAte("");
                  setCategoria("");
                }}
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </div>

        {linhas.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Nenhum atendimento ainda"
            description="Cada ordem de serviço criada aparece aqui."
            action={
              <ButtonLink href="/servicos/novo" variant="dark" icon={<Plus />}>
                Novo atendimento
              </ButtonLink>
            }
          />
        ) : list.length === 0 ? (
          <p className="px-4 pb-8 text-center text-sm text-ink-subtle">Nenhum atendimento com esses filtros.</p>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-y border-border text-left text-xs text-ink-subtle">
                  <th className="w-10 py-2.5 pl-4">
                    <Checkbox
                      aria-label="Selecionar todos"
                      checked={list.length > 0 && list.every((o) => selected.has(o.id))}
                      onChange={(v) => setSelected(v ? new Set(list.map((o) => o.id)) : new Set())}
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">Nº</th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Início</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setOpenId(o.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                  >
                    <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Selecionar OS ${docNumber(o.numero)}`}
                        checked={selected.has(o.id)}
                        onChange={() => setSelected((s) => toggleId(s, o.id))}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">{docNumber(o.numero)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.cliente ?? "Cliente não definido"}</div>
                      <div className="max-w-80 truncate text-xs text-ink-subtle">{o.servicos.join(", ") || o.relato || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted tabular-nums">{date(o.data_inicio)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{money(o.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-border border-t border-border md:hidden">
              {list.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    aria-label={`Selecionar OS ${docNumber(o.numero)}`}
                    checked={selected.has(o.id)}
                    onChange={() => setSelected((s) => toggleId(s, o.id))}
                  />
                  <button type="button" onClick={() => setOpenId(o.id)} className="min-w-0 flex-1 text-left">
                    <span className="flex justify-between gap-2">
                      <span className="truncate font-medium">{o.cliente ?? "Cliente não definido"}</span>
                      <span className="shrink-0 font-medium tabular-nums">{money(o.valor_total)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-ink-subtle">
                      <span className="font-mono">{docNumber(o.numero)}</span>
                      <StatusBadge status={o.status} />
                      <span className="ml-auto tabular-nums">{date(o.data_inicio)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <SelectionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={() => {
            setError(null);
            setConfirm([...selected]);
          }}
        />
      </Card>

      {aberto ? (
        <Drawer
          open
          onClose={() => setOpenId(null)}
          overline={`OS ${docNumber(aberto.numero)}`}
          title={aberto.cliente ?? "Cliente não definido"}
          footer={
            <>
              <Button variant="danger" size="sm" onClick={() => setConfirm([aberto.id])}>
                Excluir
              </Button>
              <span className="flex-1" />
              <ButtonLink href={`/servicos/${aberto.id}`} variant="dark" size="sm">
                Abrir atendimento
              </ButtonLink>
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={aberto.status} suffix={relativeDays(aberto.data_inicio)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-0.5 rounded-lg bg-surface-muted p-3">
              <span className="text-xs text-ink-subtle">Cliente</span>
              <span className="truncate text-sm font-semibold">{aberto.cliente ?? "Não definido"}</span>
              <span className="text-xs text-ink-subtle">{phone(aberto.telefone)}</span>
              {aberto.cliente_id ? (
                <Link href={`/clientes?abrir=${aberto.cliente_id}`} className="mt-1 text-[13px] font-medium text-brand-ink">
                  Ver cliente →
                </Link>
              ) : null}
            </div>
            <div className="grid gap-0.5 rounded-lg bg-surface-muted p-3">
              <span className="text-xs text-ink-subtle">Total</span>
              <span className="text-sm font-semibold tabular-nums">{money(aberto.valor_total)}</span>
              <span className="text-xs text-ink-subtle">
                {aberto.recebido ? `Recebido ${money(aberto.valor_recebido ?? aberto.valor_total)}` : "Não recebido"}
              </span>
              {whatsappLink(aberto.telefone) ? (
                <a
                  href={whatsappLink(aberto.telefone) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 text-[13px] font-medium text-brand-ink"
                >
                  WhatsApp →
                </a>
              ) : null}
            </div>
          </div>

          <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-ink-subtle">Início</dt>
            <dd className="tabular-nums">{date(aberto.data_inicio)}</dd>
            <dt className="text-ink-subtle">Entrega</dt>
            <dd className="tabular-nums">{aberto.data_entrega ? date(aberto.data_entrega) : "—"}</dd>
            {aberto.recebido && aberto.data_recebimento ? (
              <>
                <dt className="text-ink-subtle">Recebimento</dt>
                <dd className="tabular-nums">{date(aberto.data_recebimento)}</dd>
              </>
            ) : null}
            <dt className="text-ink-subtle">Serviços</dt>
            <dd>{aberto.servicos.join(", ") || "—"}</dd>
          </dl>

          {aberto.relato ? (
            <section>
              <h3 className="mb-1 text-sm font-semibold">Relato do cliente</h3>
              <p className="rounded-lg bg-surface-muted p-3 text-sm whitespace-pre-wrap">{aberto.relato}</p>
            </section>
          ) : null}

          <Field label="Mudar status" htmlFor="dr-status">
            <Select
              id="dr-status"
              value={aberto.status}
              disabled={pending}
              onChange={(e) => mudarStatus(aberto.id, e.target.value as Enums<"os_status">)}
            >
              {Object.entries(OS_STATUS).map(([v, s]) => (
                <option key={v} value={v}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </Drawer>
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
        pending={pending}
        title={confirm && confirm.length > 1 ? `Excluir ${confirm.length} atendimentos?` : "Excluir atendimento?"}
        description={
          <>
            Os serviços, produtos e visitas {confirm && confirm.length > 1 ? "desses atendimentos" : "deste atendimento"} também
            serão apagados. Isso não pode ser desfeito.
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </>
  );
}

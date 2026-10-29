"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Plus, Wrench } from "lucide-react";
import { useViewer } from "@/components/detalhes/viewer";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { PillTabs } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/client";
import type { Enums } from "@/lib/database.types";
import { STATUS_OPCOES } from "@/lib/documento";
import { docNumber } from "@/lib/format";
import { CATEGORIA_LABEL } from "@/lib/labels";
import { VALOR_COR } from "@/lib/status";
import { cn } from "@/lib/utils";
import { excluirAtendimentos } from "./actions";

export type OsLinha = {
  id: string;
  numero: number;
  status: Enums<"os_status">;
  data_inicio: string;
  valor_total: number;
  cliente: string | null;
  relato: string | null;
  servicos: string[];
};

type Aba = Enums<"os_status"> | "todos";
export type Filtros = { aba: Aba; q: string; de: string; ate: string; cat: string };

/**
 * Lista de OS. Os filtros ficam no endereço da página e a busca é feita no banco,
 * página por página, para continuar rápida mesmo com milhares de OS.
 */
export function ServicosList({
  linhas,
  recentes,
  contagens,
  totalFiltrado,
  pagina,
  filtros,
  algumaOs,
  porPagina,
  verId = null,
}: {
  linhas: OsLinha[];
  recentes: OsLinha[];
  contagens: Record<Enums<"os_status">, number>;
  totalFiltrado: number;
  pagina: number;
  filtros: Filtros;
  algumaOs: boolean;
  porPagina: number;
  /** OS para abrir já na janela de visualização (ex.: logo depois de Finalizar OS). */
  verId?: string | null;
}) {
  const { t, fmt } = useI18n();
  const { date, money, relativeDays } = fmt;
  const router = useRouter();
  const { abrir } = useViewer();
  const [q, setQ] = useState(filtros.q);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  const [navegando, startNav] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const somaTodos = Object.values(contagens).reduce((a, b) => a + b, 0);
  const paginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));

  useEffect(() => {
    if (verId) abrir({ tipo: "os", id: verId });
  }, [verId, abrir]);

  // Troca de página ou de filtro: limpa a seleção.
  useEffect(() => setSelected(new Set()), [linhas]);

  function aplicar(patch: Partial<Filtros> & { pagina?: number }) {
    const f = { ...filtros, q, ...patch };
    const p = new URLSearchParams();
    if (f.aba !== "todos") p.set("aba", f.aba);
    if (f.q.trim()) p.set("q", f.q.trim());
    if (f.de) p.set("de", f.de);
    if (f.ate) p.set("ate", f.ate);
    if (f.cat) p.set("cat", f.cat);
    if (patch.pagina && patch.pagina > 1) p.set("pagina", String(patch.pagina));
    const qs = p.toString();
    startNav(() => router.replace(qs ? `/servicos?${qs}` : "/servicos", { scroll: false }));
  }

  // Busca: espera a pessoa parar de digitar.
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const timer = window.setTimeout(() => aplicar({ q }), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function remove(ids: string[]) {
    start(async () => {
      const r = await excluirAtendimentos(ids);
      if (!r.ok) return setError(t(r.error));
      setConfirm(null);
      setSelected(new Set());
      router.refresh();
    });
  }

  const filtrosAtivos = Boolean(filtros.de || filtros.ate || filtros.cat);
  const semFiltro = !filtros.q && !filtrosAtivos;

  return (
    <>
      <PageHeader
        icon={Wrench}
        title={t("Atendimentos")}
        description={
          semFiltro
            ? `${somaTodos === 1 ? t("1 atendimento") : t("{n} atendimentos", { n: somaTodos })} · ${t("{n} em andamento", { n: contagens.em_andamento })}`
            : undefined
        }
        actions={
          <ButtonLink href="/servicos/novo" variant="cta" icon={<Plus />}>
            {t("Novo atendimento")}
          </ButtonLink>
        }
      />

      {recentes.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-[15px] font-semibold">{t("Mais recentes")}</h2>
          <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {recentes.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => abrir({ tipo: "os", id: o.id })}
                className="flex w-56 shrink-0 snap-start flex-col gap-2 rounded-xl bg-surface p-4 text-left shadow-card hover:shadow-pop lg:w-auto"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink-subtle">{t("OS {n}", { n: docNumber(o.numero) })}</span>
                  <span className="text-xs text-ink-subtle">{relativeDays(o.data_inicio)}</span>
                </span>
                <span className="truncate font-medium">{o.cliente ?? t("Cliente não definido")}</span>
                <span className="line-clamp-1 text-xs text-ink-subtle">{o.servicos.join(", ") || o.relato || "—"}</span>
                <span className="mt-auto flex items-center justify-between gap-2">
                  <StatusBadge status={o.status} />
                  <span className={cn("text-sm font-semibold tabular-nums", VALOR_COR[o.status])}>{money(o.valor_total, { noCents: true })}</span>
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
              value={filtros.aba}
              onChange={(aba) => aplicar({ aba })}
              items={[
                { value: "todos" as Aba, label: t("Todos"), count: somaTodos },
                ...STATUS_OPCOES.map((s) => ({ value: s.value as Aba, label: t(s.label), count: contagens[s.value] })),
              ]}
            />
            <div className="flex w-full items-center gap-2 sm:w-72">
              <SearchInput value={q} onChange={setQ} placeholder={t("Cliente, serviço ou nº")} className="w-full" />
              {navegando ? <Loader2 className="size-4 shrink-0 animate-spin text-ink-subtle" /> : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,200px))_auto] sm:items-end">
            <Field label={t("De")} htmlFor="f-de">
              <Input id="f-de" type="date" value={filtros.de} onChange={(e) => aplicar({ de: e.target.value })} />
            </Field>
            <Field label={t("Até")} htmlFor="f-ate">
              <Input id="f-ate" type="date" value={filtros.ate} onChange={(e) => aplicar({ ate: e.target.value })} />
            </Field>
            <Field label={t("Tipo de serviço")} htmlFor="f-cat">
              <Select id="f-cat" value={filtros.cat} onChange={(e) => aplicar({ cat: e.target.value })}>
                <option value="">{t("Todos os tipos")}</option>
                {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {t(l)}
                  </option>
                ))}
              </Select>
            </Field>
            {filtrosAtivos ? (
              <Button variant="ghost" onClick={() => aplicar({ de: "", ate: "", cat: "" })}>
                {t("Limpar filtros")}
              </Button>
            ) : null}
          </div>
        </div>

        {!algumaOs ? (
          <EmptyState
            icon={Wrench}
            title={t("Nenhum atendimento ainda")}
            description={t("Cada ordem de serviço criada aparece aqui.")}
            action={
              <ButtonLink href="/servicos/novo" variant="dark" icon={<Plus />}>
                {t("Novo atendimento")}
              </ButtonLink>
            }
          />
        ) : linhas.length === 0 ? (
          <p className="px-4 pb-8 text-center text-sm text-ink-subtle">{t("Nenhum atendimento com esses filtros.")}</p>
        ) : (
          <div className={navegando ? "opacity-60 transition-opacity" : undefined}>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-y border-border text-left text-xs text-ink-subtle">
                  <th className="w-10 py-2.5 pl-4">
                    <Checkbox
                      aria-label={t("Selecionar todos")}
                      checked={linhas.length > 0 && linhas.every((o) => selected.has(o.id))}
                      onChange={(v) => setSelected(v ? new Set(linhas.map((o) => o.id)) : new Set())}
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">{t("Nº")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("Cliente")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("Status")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("Início")}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t("Valor")}</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => abrir({ tipo: "os", id: o.id })}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                  >
                    <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={t("Selecionar OS {n}", { n: docNumber(o.numero) })}
                        checked={selected.has(o.id)}
                        onChange={() => setSelected((s) => toggleId(s, o.id))}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">{docNumber(o.numero)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.cliente ?? t("Cliente não definido")}</div>
                      <div className="max-w-80 truncate text-xs text-ink-subtle">{o.servicos.join(", ") || o.relato || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted tabular-nums">{date(o.data_inicio)}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", VALOR_COR[o.status])}>{money(o.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-border border-t border-border md:hidden">
              {linhas.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    aria-label={t("Selecionar OS {n}", { n: docNumber(o.numero) })}
                    checked={selected.has(o.id)}
                    onChange={() => setSelected((s) => toggleId(s, o.id))}
                  />
                  <button type="button" onClick={() => abrir({ tipo: "os", id: o.id })} className="min-w-0 flex-1 text-left">
                    <span className="flex justify-between gap-2">
                      <span className="truncate font-medium">{o.cliente ?? t("Cliente não definido")}</span>
                      <span className={cn("shrink-0 font-semibold tabular-nums", VALOR_COR[o.status])}>{money(o.valor_total)}</span>
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

            {paginas > 1 ? (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13px] text-ink-muted">
                <span>
                  {t("{de}–{ate} de {total}", {
                    de: (pagina - 1) * porPagina + 1,
                    ate: Math.min(pagina * porPagina, totalFiltrado),
                    total: totalFiltrado,
                  })}
                </span>
                <span className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronLeft />}
                    disabled={pagina <= 1 || navegando}
                    onClick={() => aplicar({ pagina: pagina - 1 })}
                  >
                    {t("Anterior")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagina >= paginas || navegando}
                    onClick={() => aplicar({ pagina: pagina + 1 })}
                  >
                    {t("Próxima")}
                    <ChevronRight />
                  </Button>
                </span>
              </div>
            ) : null}
          </div>
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

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
        pending={pending}
        title={confirm && confirm.length > 1 ? t("Excluir {n} atendimentos?", { n: confirm.length }) : t("Excluir atendimento?")}
        description={
          <>
            {confirm && confirm.length > 1
              ? t("Os serviços, produtos e visitas desses atendimentos também serão apagados. Isso não pode ser desfeito.")
              : t("Os serviços, produtos e visitas deste atendimento também serão apagados. Isso não pode ser desfeito.")}
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </>
  );
}

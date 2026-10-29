"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoriaTag } from "@/components/ui/categoria-tag";
import { Checkbox, Feedback, MoneyInput, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { nextCode, SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { PillTabs } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/client";
import type { Enums, Tables } from "@/lib/database.types";
import { duration, normalize } from "@/lib/format";
import { CATEGORIA_LABEL, TEMPOS_MEDIOS } from "@/lib/labels";
import { excluirServicos, salvarServico, type ServicoInput } from "../actions";

type Servico = Tables<"cadastro_servicos">;
type Categoria = Enums<"servico_categoria">;
type Aba = Categoria | "todos" | "sem";

const empty: ServicoInput = {
  nome: "",
  codigo: "",
  categoria: "",
  tamanho_backup: "",
  localizacao_pastas: "",
  valor: 0,
  tempo_medio_min: null,
};

function toInput(s: Servico): ServicoInput {
  return {
    id: s.id,
    nome: s.nome,
    codigo: s.codigo ?? "",
    categoria: s.categoria ?? "",
    tamanho_backup: s.tamanho_backup ?? "",
    localizacao_pastas: s.localizacao_pastas ?? "",
    valor: s.valor,
    tempo_medio_min: s.tempo_medio_min,
  };
}

const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as Categoria[];

export function CatalogoServicos({ servicos, abrirId = null }: { servicos: Servico[]; abrirId?: string | null }) {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [aba, setAba] = useState<Aba>("todos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Vindo da busca (?abrir=<id>): já abre o serviço para editar.
  const [editing, setEditing] = useState<ServicoInput | null>(() => {
    const s = abrirId ? servicos.find((x) => x.id === abrirId) : null;
    return s ? toInput(s) : null;
  });
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const buscados = useMemo(() => {
    const term = normalize(q);
    return term ? servicos.filter((s) => normalize(`${s.nome} ${s.codigo ?? ""}`).includes(term)) : servicos;
  }, [servicos, q]);
  const contar = (a: Aba) =>
    a === "todos" ? buscados.length : buscados.filter((s) => (a === "sem" ? !s.categoria : s.categoria === a)).length;
  const list = aba === "todos" ? buscados : buscados.filter((s) => (aba === "sem" ? !s.categoria : s.categoria === aba));
  const temSemCategoria = servicos.some((s) => !s.categoria);

  function save() {
    if (!editing) return;
    start(async () => {
      const r = await salvarServico(editing);
      if (!r.ok) return setError(t(r.error));
      setEditing(null);
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const r = await excluirServicos([...selected]);
      if (!r.ok) return setError(t(r.error));
      setConfirm(false);
      setSelected(new Set());
      router.refresh();
    });
  }

  const abrir = (s: Servico) => {
    setError(null);
    setEditing(toInput(s));
  };
  const set = (patch: Partial<ServicoInput>) => setEditing((e) => (e ? { ...e, ...patch } : e));
  const tempos =
    editing?.tempo_medio_min && !TEMPOS_MEDIOS.includes(editing.tempo_medio_min)
      ? [...TEMPOS_MEDIOS, editing.tempo_medio_min].sort((a, b) => a - b)
      : TEMPOS_MEDIOS;

  return (
    <Card>
      <div className="grid gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={q} onChange={setQ} placeholder={t("Buscar serviço ou código")} className="w-full sm:w-72" />
          <Button
            variant="dark"
            icon={<Plus />}
            onClick={() => {
              setError(null);
              setEditing({
                ...empty,
                categoria: aba !== "todos" && aba !== "sem" ? aba : "",
                codigo: nextCode("SV", servicos.map((s) => s.codigo)),
              });
            }}
            className="w-full sm:w-auto"
          >
            {t("Novo serviço")}
          </Button>
        </div>
        {servicos.length > 0 ? (
          <PillTabs
            value={aba}
            onChange={setAba}
            items={[
              { value: "todos" as Aba, label: t("Todos"), count: contar("todos") },
              ...CATEGORIAS.map((c) => ({ value: c as Aba, label: t(CATEGORIA_LABEL[c]), count: contar(c) })),
              ...(temSemCategoria ? [{ value: "sem" as Aba, label: t("Sem categoria"), count: contar("sem") }] : []),
            ]}
          />
        ) : null}
      </div>

      {servicos.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={t("Nenhum serviço cadastrado")}
          description={t("Cadastre os serviços que você mais faz. Eles aparecem para escolher na OS, já com valor e tempo médio.")}
        />
      ) : list.length === 0 ? (
        <p className="px-4 pb-6 text-center text-sm text-ink-subtle">
          {q ? t("Nenhum serviço encontrado para “{q}”.", { q }) : t("Nenhum serviço nesta categoria.")}
        </p>
      ) : (
        <>
          {/* Computador: tabela com cabeçalho */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-y border-border text-left text-xs text-ink-subtle">
                <th className="w-10 py-2.5 pl-4">
                  <Checkbox
                    aria-label={t("Selecionar todos")}
                    checked={list.length > 0 && list.every((s) => selected.has(s.id))}
                    onChange={(v) => setSelected(v ? new Set(list.map((s) => s.id)) : new Set())}
                  />
                </th>
                <th className="px-4 py-2.5 font-medium">{t("Serviço")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Código")}</th>
                <th className="px-4 py-2.5 font-medium">{t("Tipo de serviço")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("Tempo médio")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("Valor")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} onClick={() => abrir(s)} className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={t("Selecionar {nome}", { nome: s.nome })}
                      checked={selected.has(s.id)}
                      onChange={() => setSelected((set) => toggleId(set, s.id))}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{s.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-subtle">{s.codigo ?? "—"}</td>
                  <td className="px-4 py-3">{s.categoria ? <CategoriaTag categoria={s.categoria} /> : <span className="text-ink-subtle">—</span>}</td>
                  <td className="px-4 py-3 text-right text-ink-muted tabular-nums">
                    {s.tempo_medio_min ? duration(s.tempo_medio_min) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-success tabular-nums">{fmt.money(s.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Celular: lista de cards */}
          <ul className="divide-y divide-border border-t border-border md:hidden">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  aria-label={t("Selecionar {nome}", { nome: s.nome })}
                  checked={selected.has(s.id)}
                  onChange={() => setSelected((set) => toggleId(set, s.id))}
                />
                <button type="button" onClick={() => abrir(s)} className="grid min-w-0 flex-1 gap-1 text-left">
                  <span className="flex justify-between gap-2">
                    <span className="truncate font-medium">{s.nome}</span>
                    <span className="shrink-0 font-semibold text-success tabular-nums">{fmt.money(s.valor)}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                    {s.categoria ? <CategoriaTag categoria={s.categoria} /> : null}
                    {s.codigo ? <span className="font-mono">{s.codigo}</span> : null}
                    {s.tempo_medio_min ? <span className="tabular-nums">{duration(s.tempo_medio_min)}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} onDelete={() => setConfirm(true)} />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? t("Editar serviço") : t("Novo serviço")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("Cancelar")}
            </Button>
            <Button variant="dark" onClick={save} disabled={pending}>
              {pending ? t("Salvando…") : t("Salvar serviço")}
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t("Nome do serviço")} required htmlFor="sv-nome">
                <Input
                  id="sv-nome"
                  autoFocus
                  placeholder={t("Exemplo: Formatação com backup")}
                  value={editing.nome}
                  onChange={(e) => set({ nome: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("Código interno")} htmlFor="sv-cod">
              <div className="flex gap-2">
                <Input id="sv-cod" className="font-mono" value={editing.codigo} onChange={(e) => set({ codigo: e.target.value })} />
                <Button
                  variant="outline"
                  onClick={() => set({ codigo: nextCode("SV", servicos.filter((s) => s.id !== editing.id).map((s) => s.codigo)) })}
                >
                  {t("Gerar")}
                </Button>
              </div>
            </Field>
            <Field label={t("Tipo de serviço")} htmlFor="sv-cat">
              <Select id="sv-cat" value={editing.categoria} onChange={(e) => set({ categoria: e.target.value as Categoria | "" })}>
                <option value="">{t("Sem categoria")}</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {t(CATEGORIA_LABEL[c])}
                  </option>
                ))}
              </Select>
            </Field>
            {editing.categoria === "backup_recuperacao" ? (
              <>
                <Field label={t("Tamanho do backup")} htmlFor="sv-tb">
                  <Input
                    id="sv-tb"
                    placeholder={t("Exemplo: até 500 GB")}
                    value={editing.tamanho_backup}
                    onChange={(e) => set({ tamanho_backup: e.target.value })}
                  />
                </Field>
                <Field label={t("Localização e pastas")} htmlFor="sv-lp">
                  <Input
                    id="sv-lp"
                    placeholder={t("Exemplo: Documentos, Fotos")}
                    value={editing.localizacao_pastas}
                    onChange={(e) => set({ localizacao_pastas: e.target.value })}
                  />
                </Field>
              </>
            ) : null}
            <Field label={t("Valor do serviço")} htmlFor="sv-valor">
              <MoneyInput id="sv-valor" value={editing.valor} onChange={(v) => set({ valor: v })} />
            </Field>
            <Field label={t("Tempo médio")} htmlFor="sv-tempo" hint={t("Soma na duração sugerida da visita")}>
              <Select
                id="sv-tempo"
                value={editing.tempo_medio_min ?? ""}
                onChange={(e) => set({ tempo_medio_min: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">{t("Não informado")}</option>
                {tempos.map((m) => (
                  <option key={m} value={m}>
                    {duration(m)}
                  </option>
                ))}
              </Select>
            </Field>
            {error ? (
              <div className="sm:col-span-2">
                <Feedback kind="error">{error}</Feedback>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        pending={pending}
        title={selected.size === 1 ? t("Excluir serviço?") : t("Excluir {n} serviços?", { n: selected.size })}
        description={
          <>
            {t("Eles saem do catálogo. Atendimentos e orçamentos que já usaram esses serviços continuam com o nome e o valor registrados.")}
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </Card>
  );
}

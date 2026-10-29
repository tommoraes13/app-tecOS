"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Feedback, MoneyInput, Select } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { nextCode, SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { Tag } from "@/components/ui/status-badge";
import type { Enums, Tables } from "@/lib/database.types";
import { duration, money, normalize } from "@/lib/format";
import { CATEGORIA_LABEL, EQUIPAMENTO_CURTO, TEMPOS_MEDIOS } from "@/lib/labels";
import { excluirServicos, salvarServico, type ServicoInput } from "./actions";

type Servico = Tables<"cadastro_servicos">;

const empty: ServicoInput = {
  nome: "",
  codigo: "",
  categoria: "",
  tamanho_backup: "",
  localizacao_pastas: "",
  valor: 0,
  tempo_medio_min: null,
  tipo_equipamento: "",
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
    tipo_equipamento: s.tipo_equipamento ?? "",
  };
}

const TIPOS_EQUIPAMENTO = Object.values(EQUIPAMENTO_CURTO);

export function CatalogoServicos({ servicos }: { servicos: Servico[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ServicoInput | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => {
    const term = normalize(q);
    return term
      ? servicos.filter((s) => normalize(`${s.nome} ${s.codigo ?? ""}`).includes(term))
      : servicos;
  }, [servicos, q]);

  function save() {
    if (!editing) return;
    start(async () => {
      const r = await salvarServico(editing);
      if (!r.ok) return setError(r.error);
      setEditing(null);
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const r = await excluirServicos([...selected]);
      if (!r.ok) return setError(r.error);
      setConfirm(false);
      setSelected(new Set());
      router.refresh();
    });
  }

  const set = (patch: Partial<ServicoInput>) => setEditing((e) => (e ? { ...e, ...patch } : e));
  const tipoOutro = editing && editing.tipo_equipamento !== "" && !TIPOS_EQUIPAMENTO.includes(editing.tipo_equipamento);
  const tempos =
    editing?.tempo_medio_min && !TEMPOS_MEDIOS.includes(editing.tempo_medio_min)
      ? [...TEMPOS_MEDIOS, editing.tempo_medio_min].sort((a, b) => a - b)
      : TEMPOS_MEDIOS;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar serviço ou código" className="w-full sm:w-72" />
        <Button
          variant="dark"
          icon={<Plus />}
          onClick={() => {
            setError(null);
            setEditing({ ...empty, codigo: nextCode("SV", servicos.map((s) => s.codigo)) });
          }}
          className="w-full sm:w-auto"
        >
          Novo serviço
        </Button>
      </div>

      {servicos.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nenhum serviço cadastrado"
          description="Cadastre os serviços que você mais faz. Eles aparecem para escolher na OS, já com valor e tempo médio."
        />
      ) : list.length === 0 ? (
        <p className="px-4 pb-6 text-center text-sm text-ink-subtle">Nenhum serviço encontrado para “{q}”.</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {list.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted">
              <Checkbox
                aria-label={`Selecionar ${s.nome}`}
                checked={selected.has(s.id)}
                onChange={() => setSelected((set) => toggleId(set, s.id))}
              />
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditing(toInput(s));
                }}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.nome}</span>
                  <span className="block text-xs text-ink-subtle">
                    {[s.codigo, s.categoria ? CATEGORIA_LABEL[s.categoria] : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {s.tipo_equipamento ? <Tag>{s.tipo_equipamento}</Tag> : null}
                <span className="w-14 text-right text-[13px] text-ink-subtle tabular-nums">
                  {s.tempo_medio_min ? duration(s.tempo_medio_min) : ""}
                </span>
                <span className="w-24 text-right font-medium tabular-nums">{money(s.valor)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} onDelete={() => setConfirm(true)} />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Editar serviço" : "Novo serviço"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button variant="dark" onClick={save} disabled={pending}>
              {pending ? "Salvando…" : "Salvar serviço"}
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nome do serviço" required htmlFor="sv-nome">
                <Input
                  id="sv-nome"
                  autoFocus
                  placeholder="Exemplo: Formatação com backup"
                  value={editing.nome}
                  onChange={(e) => set({ nome: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Código interno" htmlFor="sv-cod">
              <div className="flex gap-2">
                <Input
                  id="sv-cod"
                  className="font-mono"
                  value={editing.codigo}
                  onChange={(e) => set({ codigo: e.target.value })}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    set({ codigo: nextCode("SV", servicos.filter((s) => s.id !== editing.id).map((s) => s.codigo)) })
                  }
                >
                  Gerar
                </Button>
              </div>
            </Field>
            <Field label="Tipo de serviço" htmlFor="sv-cat">
              <Select
                id="sv-cat"
                value={editing.categoria}
                onChange={(e) => set({ categoria: e.target.value as Enums<"servico_categoria"> | "" })}
              >
                <option value="">Sem categoria</option>
                {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            {editing.categoria === "backup_recuperacao" ? (
              <>
                <Field label="Tamanho do backup" htmlFor="sv-tb">
                  <Input
                    id="sv-tb"
                    placeholder="Exemplo: até 500 GB"
                    value={editing.tamanho_backup}
                    onChange={(e) => set({ tamanho_backup: e.target.value })}
                  />
                </Field>
                <Field label="Localização e pastas" htmlFor="sv-lp">
                  <Input
                    id="sv-lp"
                    placeholder="Exemplo: Documentos, Fotos"
                    value={editing.localizacao_pastas}
                    onChange={(e) => set({ localizacao_pastas: e.target.value })}
                  />
                </Field>
              </>
            ) : null}
            <Field label="Valor do serviço" htmlFor="sv-valor">
              <MoneyInput id="sv-valor" value={editing.valor} onChange={(v) => set({ valor: v })} />
            </Field>
            <Field label="Tempo médio" htmlFor="sv-tempo" hint="Soma na duração sugerida da visita">
              <Select
                id="sv-tempo"
                value={editing.tempo_medio_min ?? ""}
                onChange={(e) => set({ tempo_medio_min: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Não informado</option>
                {tempos.map((m) => (
                  <option key={m} value={m}>
                    {duration(m)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Tipo de equipamento" htmlFor="sv-te">
                <Select
                  id="sv-te"
                  value={tipoOutro ? "__outro" : editing.tipo_equipamento}
                  onChange={(e) => set({ tipo_equipamento: e.target.value === "__outro" ? " " : e.target.value })}
                >
                  <option value="">Qualquer equipamento</option>
                  {TIPOS_EQUIPAMENTO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__outro">Outro (digitar)</option>
                </Select>
              </Field>
              {tipoOutro ? (
                <Input
                  className="mt-2"
                  aria-label="Outro tipo de equipamento"
                  placeholder="Exemplo: Celular"
                  value={editing.tipo_equipamento.trimStart()}
                  onChange={(e) => set({ tipo_equipamento: e.target.value || " " })}
                />
              ) : null}
            </div>
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
        title={selected.size === 1 ? "Excluir serviço?" : `Excluir ${selected.size} serviços?`}
        description={
          <>
            Eles saem do catálogo. Atendimentos e orçamentos que já usaram esses serviços continuam com o nome e o valor
            registrados.
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </Card>
  );
}

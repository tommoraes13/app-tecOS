"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Feedback, MoneyInput } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { nextCode, SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import type { Tables } from "@/lib/database.types";
import { money, normalize } from "@/lib/format";
import { excluirProdutos, salvarProduto, type ProdutoInput } from "./actions";

type Produto = Tables<"cadastro_produtos">;

const empty: ProdutoInput = { nome: "", codigo: "", valor_custo: null, valor_venda: 0 };

export function CatalogoProdutos({ produtos }: { produtos: Produto[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ProdutoInput | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => {
    const term = normalize(q);
    return term ? produtos.filter((p) => normalize(`${p.nome} ${p.codigo ?? ""}`).includes(term)) : produtos;
  }, [produtos, q]);

  function save() {
    if (!editing) return;
    start(async () => {
      const r = await salvarProduto(editing);
      if (!r.ok) return setError(r.error);
      setEditing(null);
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const r = await excluirProdutos([...selected]);
      if (!r.ok) return setError(r.error);
      setConfirm(false);
      setSelected(new Set());
      router.refresh();
    });
  }

  const set = (patch: Partial<ProdutoInput>) => setEditing((e) => (e ? { ...e, ...patch } : e));
  const margem =
    editing && editing.valor_custo && editing.valor_venda > 0
      ? ((editing.valor_venda - editing.valor_custo) / editing.valor_venda) * 100
      : null;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar produto ou código" className="w-full sm:w-72" />
        <Button
          variant="dark"
          icon={<Plus />}
          onClick={() => {
            setError(null);
            setEditing({ ...empty, codigo: nextCode("PR", produtos.map((p) => p.codigo)) });
          }}
          className="w-full sm:w-auto"
        >
          Novo produto
        </Button>
      </div>

      {produtos.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Cadastre peças e itens que você vende, como SSD, memória e cabos. Eles aparecem para escolher na OS."
        />
      ) : list.length === 0 ? (
        <p className="px-4 pb-6 text-center text-sm text-ink-subtle">Nenhum produto encontrado para “{q}”.</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted">
              <Checkbox
                aria-label={`Selecionar ${p.nome}`}
                checked={selected.has(p.id)}
                onChange={() => setSelected((set) => toggleId(set, p.id))}
              />
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditing({
                    id: p.id,
                    nome: p.nome,
                    codigo: p.codigo ?? "",
                    valor_custo: p.valor_custo,
                    valor_venda: p.valor_venda,
                  });
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.nome}</span>
                  <span className="block font-mono text-xs text-ink-subtle">{p.codigo}</span>
                </span>
                <span className="hidden w-28 text-right text-[13px] text-ink-subtle tabular-nums sm:block">
                  {p.valor_custo !== null ? `custo ${money(p.valor_custo)}` : ""}
                </span>
                <span className="w-24 text-right font-medium tabular-nums">{money(p.valor_venda)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} onDelete={() => setConfirm(true)} />

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Editar produto" : "Novo produto"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button variant="dark" onClick={save} disabled={pending}>
              {pending ? "Salvando…" : "Salvar produto"}
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nome do produto" required htmlFor="pr-nome">
                <Input
                  id="pr-nome"
                  autoFocus
                  placeholder="Exemplo: SSD 480 GB"
                  value={editing.nome}
                  onChange={(e) => set({ nome: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Código interno" htmlFor="pr-cod">
                <div className="flex gap-2">
                  <Input
                    id="pr-cod"
                    className="font-mono"
                    value={editing.codigo}
                    onChange={(e) => set({ codigo: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      set({ codigo: nextCode("PR", produtos.filter((p) => p.id !== editing.id).map((p) => p.codigo)) })
                    }
                  >
                    Gerar
                  </Button>
                </div>
              </Field>
            </div>
            <Field label="Valor de custo" htmlFor="pr-custo">
              <MoneyInput
                id="pr-custo"
                value={editing.valor_custo ?? 0}
                onChange={(v) => set({ valor_custo: v || null })}
              />
            </Field>
            <Field
              label="Valor de venda"
              htmlFor="pr-venda"
              hint={margem !== null ? `Margem de ${margem.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : undefined}
            >
              <MoneyInput id="pr-venda" value={editing.valor_venda} onChange={(v) => set({ valor_venda: v })} />
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
        title={selected.size === 1 ? "Excluir produto?" : `Excluir ${selected.size} produtos?`}
        description={
          <>
            Eles saem do catálogo. Atendimentos e orçamentos que já usaram esses produtos continuam com o nome e o valor
            registrados.
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </Card>
  );
}

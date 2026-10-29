"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { ClienteModal } from "@/components/clientes/cliente-modal";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Select } from "@/components/ui/controls";
import { SelectionBar, toggleId } from "@/components/ui/list-toolbar";
import { ConfirmDialog } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import type { Enums, Tables } from "@/lib/database.types";
import { date, normalize, phone } from "@/lib/format";
import { CANAL_LABEL } from "@/lib/labels";
import { excluirClientes } from "./actions";
import { ClienteDrawer } from "./cliente-drawer";

export type ClienteResumo = Tables<"clientes_resumo">;
type Cliente = Tables<"base_clientes">;

/** A visão de resumo tem os mesmos campos do cliente, só que todos opcionais. */
export function toCliente(r: ClienteResumo): Cliente {
  return {
    id: r.id ?? "",
    user_id: r.user_id ?? "",
    nome: r.nome ?? "",
    telefone: r.telefone ?? "",
    email: r.email,
    canal: r.canal,
    cep: r.cep,
    endereco: r.endereco,
    numero: r.numero,
    complemento: r.complemento,
    bairro: r.bairro,
    cidade: r.cidade,
    estado: r.estado,
    observacoes: r.observacoes,
    created_at: r.created_at ?? "",
    updated_at: r.updated_at ?? "",
  };
}

export function ClientesList({ clientes, abrirId }: { clientes: ClienteResumo[]; abrirId: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState<Enums<"cliente_canal"> | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(abrirId);
  const [modal, setModal] = useState<{ cliente: Cliente | null } | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setOpenId(abrirId), [abrirId]);

  const list = useMemo(() => {
    const term = normalize(q);
    const digits = q.replace(/\D/g, "");
    return clientes.filter((c) => {
      if (canal && c.canal !== canal) return false;
      if (!term) return true;
      return (
        normalize(`${c.nome} ${c.email ?? ""} ${c.cidade ?? ""} ${c.bairro ?? ""}`).includes(term) ||
        (digits.length >= 3 && (c.telefone ?? "").includes(digits))
      );
    });
  }, [clientes, q, canal]);

  const aberto = clientes.find((c) => c.id === openId) ?? null;

  function remove(ids: string[]) {
    start(async () => {
      const r = await excluirClientes(ids);
      if (!r.ok) return setError(r.error);
      setConfirm(null);
      setSelected(new Set());
      if (openId && ids.includes(openId)) setOpenId(null);
      router.refresh();
    });
  }

  const allChecked = list.length > 0 && list.every((c) => c.id && selected.has(c.id));
  const totalAtend = (ids: string[]) =>
    clientes.filter((c) => c.id && ids.includes(c.id)).reduce((s, c) => s + (c.servicos_prestados ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}`}
        actions={
          <Button variant="cta" icon={<Plus />} onClick={() => setModal({ cliente: null })}>
            Novo cliente
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Nome, telefone, e-mail ou cidade"
            className="w-full sm:w-80"
          />
          <div className="w-full sm:w-56">
            <Select
              aria-label="Filtrar por canal"
              value={canal}
              onChange={(e) => setCanal(e.target.value as Enums<"cliente_canal"> | "")}
            >
              <option value="">Todos os canais</option>
              {Object.entries(CANAL_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {clientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente cadastrado"
            description="Cadastre aqui ou direto na criação de um atendimento."
          />
        ) : list.length === 0 ? (
          <p className="px-4 pb-8 text-center text-sm text-ink-subtle">Nenhum cliente encontrado.</p>
        ) : (
          <>
            {/* Computador: tabela */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-y border-border text-left text-xs font-medium text-ink-subtle">
                  <th className="w-10 py-2.5 pl-4">
                    <Checkbox
                      aria-label="Selecionar todos"
                      checked={allChecked}
                      onChange={(v) => setSelected(v ? new Set(list.map((c) => c.id ?? "")) : new Set())}
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Bairro / cidade</th>
                  <th className="px-4 py-2.5 font-medium">Canal</th>
                  <th className="px-4 py-2.5 text-right font-medium">Serviços</th>
                  <th className="px-4 py-2.5 text-right font-medium">Último atendimento</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setOpenId(c.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                  >
                    <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Selecionar ${c.nome}`}
                        checked={selected.has(c.id ?? "")}
                        onChange={() => setSelected((s) => toggleId(s, c.id ?? ""))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.nome}</div>
                      <div className="text-xs text-ink-subtle">{phone(c.telefone)}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {[c.bairro, c.cidade].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{c.canal ? CANAL_LABEL[c.canal] : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.servicos_prestados ?? 0}</td>
                    <td className="px-4 py-3 text-right text-ink-muted tabular-nums">
                      {c.ultimo_atendimento ? date(c.ultimo_atendimento) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Celular: lista de cards */}
            <ul className="divide-y divide-border border-t border-border md:hidden">
              {list.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    aria-label={`Selecionar ${c.nome}`}
                    checked={selected.has(c.id ?? "")}
                    onChange={() => setSelected((s) => toggleId(s, c.id ?? ""))}
                  />
                  <button type="button" onClick={() => setOpenId(c.id)} className="min-w-0 flex-1 text-left">
                    <span className="flex justify-between gap-2">
                      <span className="truncate font-medium">{c.nome}</span>
                      <span className="shrink-0 text-xs text-ink-subtle tabular-nums">
                        {c.servicos_prestados ?? 0} {c.servicos_prestados === 1 ? "serviço" : "serviços"}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-ink-subtle">
                      {[phone(c.telefone), c.bairro, c.cidade].filter(Boolean).join(" · ")}
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

      <ClienteDrawer
        cliente={aberto}
        onClose={() => setOpenId(null)}
        onEdit={(c) => setModal({ cliente: c })}
        onDelete={(id) => {
          setError(null);
          setConfirm([id]);
        }}
      />

      <ClienteModal
        open={modal !== null}
        cliente={modal?.cliente ?? null}
        onClose={() => setModal(null)}
        onSaved={(c) => {
          setModal(null);
          setOpenId(c.id);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
        pending={pending}
        title={confirm && confirm.length > 1 ? `Excluir ${confirm.length} clientes?` : "Excluir cliente?"}
        description={
          <>
            {confirm && totalAtend(confirm) > 0 ? (
              <>
                Os {totalAtend(confirm)} atendimentos e os orçamentos continuam salvos, com o cliente como “Não definido”.{" "}
              </>
            ) : null}
            Os equipamentos cadastrados {confirm && confirm.length > 1 ? "desses clientes" : "deste cliente"} serão apagados.
            Isso não pode ser desfeito.
            {error ? <span className="mt-2 block text-danger">{error}</span> : null}
          </>
        }
      />
    </>
  );
}

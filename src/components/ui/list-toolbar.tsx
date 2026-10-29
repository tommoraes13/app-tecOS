"use client";

import { Trash2 } from "lucide-react";

/** Barra que aparece ao selecionar linhas: contagem + excluir selecionados. */
export function SelectionBar({
  count,
  onClear,
  onDelete,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 border-t border-border bg-surface-muted px-4 py-2.5 text-[13px]">
      <span className="font-medium">
        {count} {count === 1 ? "selecionado" : "selecionados"}
      </span>
      <button type="button" onClick={onClear} className="text-ink-muted hover:text-ink">
        Limpar
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-danger-bg px-3 font-medium text-danger"
      >
        <Trash2 className="size-3.5" />
        Excluir selecionados
      </button>
    </div>
  );
}

/** Controla quais ids estão marcados numa lista. */
export function toggleId(set: Set<string>, id: string) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Próximo código interno: SV0001, SV0002… */
export function nextCode(prefix: string, existing: (string | null)[]) {
  const max = existing.reduce((acc, code) => {
    if (!code?.startsWith(prefix)) return acc;
    const n = Number(code.slice(prefix.length));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

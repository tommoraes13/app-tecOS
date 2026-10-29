"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { normalize } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ComboItem = { id: string; label: string; sublabel?: string; right?: string; search?: string };

/**
 * Caixa de pesquisa com lista (Design System > Input, select com busca).
 * `freeLabel` permite usar o texto digitado como item avulso ("Outro").
 */
export function Combobox({
  items,
  valueLabel,
  onSelect,
  onFree,
  freeLabel,
  placeholder = "Buscar",
  emptyText = "Nada encontrado",
  id,
  autoFocus,
}: {
  items: ComboItem[];
  valueLabel: string;
  onSelect: (item: ComboItem | null) => void;
  onFree?: (text: string) => void;
  freeLabel?: (text: string) => string;
  placeholder?: string;
  emptyText?: string;
  id?: string;
  autoFocus?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const t = normalize(q);
    const list = t ? items.filter((i) => normalize(`${i.label} ${i.sublabel ?? ""} ${i.search ?? ""}`).includes(t)) : items;
    return list.slice(0, 50);
  }, [items, q]);

  const showFree = Boolean(onFree && q.trim());
  const total = filtered.length + (showFree ? 1 : 0);

  function choose(index: number) {
    if (index < filtered.length) onSelect(filtered[index]);
    else if (showFree) onFree?.(q.trim());
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex h-11 items-center gap-2 rounded-md border border-border-control bg-surface px-3 focus-within:border-focus-ring focus-within:shadow-[0_0_0_3px_var(--brand-100)] lg:h-10">
        <Search className="size-4 shrink-0 text-ink-subtle" />
        <input
          id={id}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          value={open ? q : valueLabel}
          placeholder={valueLabel || placeholder}
          onFocus={() => {
            setOpen(true);
            setQ("");
            setActive(0);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, total - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && total > 0) {
              e.preventDefault();
              choose(active);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-subtle"
        />
        {valueLabel && !open ? (
          <button
            type="button"
            aria-label="Limpar"
            onClick={() => onSelect(null)}
            className="inline-grid size-7 place-items-center rounded-md text-ink-subtle hover:bg-surface-muted"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronDown className="size-4 shrink-0 text-ink-subtle" />
        )}
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-pop"
        >
          {filtered.map((item, i) => (
            <li key={item.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                  i === active && "bg-surface-muted",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.sublabel ? <span className="block truncate text-xs text-ink-subtle">{item.sublabel}</span> : null}
                </span>
                {item.right ? <span className="shrink-0 text-xs text-ink-muted tabular-nums">{item.right}</span> : null}
              </button>
            </li>
          ))}
          {showFree ? (
            <li role="option" aria-selected={active === filtered.length}>
              <button
                type="button"
                onMouseEnter={() => setActive(filtered.length)}
                onClick={() => choose(filtered.length)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm font-medium text-brand-ink",
                  active === filtered.length && "bg-surface-muted",
                )}
              >
                {freeLabel ? freeLabel(q.trim()) : `Usar “${q.trim()}”`}
              </button>
            </li>
          ) : null}
          {total === 0 ? <li className="px-3 py-2 text-sm text-ink-subtle">{emptyText}</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

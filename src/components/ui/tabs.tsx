"use client";

import { cn } from "@/lib/utils";

type TabItem<T extends string> = { value: T; label: string; count?: number };

/** Abas em pílula (Design System > Tabs). Até 6 itens; rola na horizontal no celular. */
export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-muted p-1", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              active ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="text-xs text-ink-subtle tabular-nums">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

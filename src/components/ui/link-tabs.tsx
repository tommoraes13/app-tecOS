import Link from "next/link";
import { cn } from "@/lib/utils";

/** Abas em pílula que trocam de página pelo endereço (ex.: ?aba=servicos). */
export function LinkTabs({
  items,
  active,
  className,
}: {
  items: { href: string; label: string; value: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-muted p-1", className)}>
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Link
            key={item.value}
            href={item.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors lg:h-8",
              isActive ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined ? <span className="text-xs text-ink-subtle tabular-nums">{item.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

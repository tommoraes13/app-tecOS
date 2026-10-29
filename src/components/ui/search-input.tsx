"use client";

import { Search } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Campo de busca em pílula (Design System > Input, variante busca). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <label
      className={cn(
        "flex h-11 items-center gap-2 rounded-full bg-surface-muted px-3.5 focus-within:shadow-[0_0_0_3px_var(--brand-100)] lg:h-10",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-ink-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("Buscar")}
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </label>
  );
}

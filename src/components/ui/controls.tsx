"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-md border border-border-control bg-surface px-3 text-sm text-ink transition-[border-color,box-shadow] outline-none focus:border-focus-ring focus:shadow-[0_0_0_3px_var(--brand-100)] disabled:opacity-60";

/** Select nativo com o visual do Design System. */
export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, "h-11 appearance-none pr-9 lg:h-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-subtle" />
    </div>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[88px] resize-y py-2.5", className)} {...props} />;
}

/** Switch liga/desliga (Design System > Toggle). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-brand-600" : "bg-border-control",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

/** Checkbox (Design System > Toggle). */
export function Checkbox({
  checked,
  onChange,
  label,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm select-none", className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          "grid size-[18px] shrink-0 place-items-center rounded-sm border-[1.5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring",
          checked ? "border-brand-700 bg-brand-700 text-on-brand" : "border-border-control bg-surface text-transparent",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

/** Campo de dinheiro: digita só números e ele preenche os centavos (1250 → R$ 12,50). Usa a moeda do usuário. */
export function MoneyInput({
  value,
  onChange,
  id,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const { fmt } = useI18n();
  const cents = Math.round((Number.isFinite(value) ? value : 0) * 100);
  const display = fmt.decimal(cents / 100);
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-border-control bg-surface pr-3 pl-1.5 transition-[border-color,box-shadow] focus-within:border-focus-ring focus-within:shadow-[0_0_0_3px_var(--brand-100)] lg:h-10",
        disabled && "opacity-60",
        className,
      )}
    >
      <span className="inline-flex h-7 items-center rounded-lg bg-surface-muted px-2.5 text-xs font-medium text-ink-muted">
        {fmt.currencySymbol}
      </span>
      <input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        aria-label={ariaLabel}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
          onChange(Number(digits || "0") / 100);
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-sm tabular-nums outline-none"
      />
    </div>
  );
}

/**
 * Seção de formulário que começa fechada e abre ao ligar o switch
 * (Design System > CollapsibleSection).
 */
export function CollapsibleSection({
  title,
  enabled,
  onEnabledChange,
  summary,
  children,
  alwaysOn = false,
}: {
  title: string;
  enabled: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
  alwaysOn?: boolean;
}) {
  const [open, setOpen] = React.useState(enabled);
  const isOn = alwaysOn || enabled;

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
        {alwaysOn ? null : (
          <Switch
            checked={enabled}
            onChange={(v) => {
              onEnabledChange?.(v);
              setOpen(v);
            }}
          />
        )}
        <button
          type="button"
          disabled={!isOn}
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
        >
          <span className="text-[15px] leading-[22px] font-semibold">{title}</span>
          <span className="ml-auto truncate text-[13px] text-ink-subtle">{summary}</span>
          {isOn ? (
            open ? (
              <ChevronUp className="size-4 shrink-0 text-ink-subtle" />
            ) : (
              <ChevronDown className="size-4 shrink-0 text-ink-subtle" />
            )
          ) : null}
        </button>
      </div>
      {isOn && open ? <div className="grid gap-3 border-t border-border p-4">{children}</div> : null}
    </div>
  );
}

/** Mensagem curta de retorno (salvo, erro). */
export function Feedback({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2 text-[13px]",
        kind === "ok" ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
      )}
    >
      {children}
    </p>
  );
}

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = { label: string; value: string };

/** Card de número-chave do Dashboard (Design System > StatCard). */
export function StatCard({
  label,
  value,
  delta,
  rows = [],
  featured = false,
}: {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  rows?: Row[];
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl p-4 sm:gap-3.5 sm:p-5",
        featured ? "bg-brand-gradient text-on-brand shadow-cta" : "bg-surface shadow-card",
      )}
    >
      <span className={cn("text-[13px] leading-[18px]", featured ? "text-on-brand-muted" : "text-ink-muted")}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[22px] leading-7 font-semibold tracking-[-0.02em] tabular-nums sm:text-[28px] sm:leading-8">
        {value}
        {delta ? (
          <span
            className={cn(
              "inline-flex h-[22px] items-center gap-0.5 rounded-full px-2 text-xs font-medium tracking-normal [&_svg]:size-3",
              delta.direction === "up" ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
            )}
          >
            {delta.direction === "up" ? <ArrowUp /> : <ArrowDown />}
            {delta.value}
          </span>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <div className={cn("grid gap-1 text-xs", featured ? "text-on-brand-muted" : "text-ink-subtle")}>
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-2">
              {r.label}
              <strong className={cn("font-medium tabular-nums", featured ? "text-on-brand" : "text-ink")}>
                {r.value}
              </strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

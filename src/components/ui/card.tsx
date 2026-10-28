import { cn } from "@/lib/utils";

/** Card branco padrão (cantos radius-xl, sombra discreta). */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl bg-surface shadow-card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
      <div>
        <h2 className="text-[15px] leading-[22px] font-semibold">{title}</h2>
        {description ? <p className="text-[13px] leading-[18px] text-ink-subtle">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

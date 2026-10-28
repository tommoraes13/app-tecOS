import type { LucideIcon } from "lucide-react";

/** Estado vazio: ícone, frase curta e, quando fizer sentido, um botão. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-surface-muted text-ink-subtle">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-[13px] leading-[18px] text-ink-subtle">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

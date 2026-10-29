import type { LucideIcon } from "lucide-react";

/** Ícone discreto ao lado do título da tela. */
export function TitleIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-ink lg:size-9">
      <Icon className="size-4 lg:size-[18px]" strokeWidth={2} />
    </span>
  );
}

/** Cabeçalho de toda tela: ícone + título + contexto à esquerda, ações à direita. */
export function PageHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? <TitleIcon icon={icon} /> : null}
        <div className="min-w-0">
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]">{title}</h1>
          {description ? <p className="mt-1 text-[13px] leading-[18px] text-ink-subtle">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

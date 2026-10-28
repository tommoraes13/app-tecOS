/** Cabeçalho de toda tela: título + contexto à esquerda, ações à direita. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]">
          {title}
        </h1>
        {description ? <p className="mt-1 text-[13px] leading-[18px] text-ink-subtle">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Esqueleto mostrado na hora do clique, enquanto a próxima tela carrega. */
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />;
}

export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div className="space-y-2">
          <Bar className="h-7 w-56 lg:h-8" />
          <Bar className="h-4 w-40" />
        </div>
        <Bar className="h-10 w-44 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl bg-surface p-5 shadow-card">
            <Bar className="h-4 w-24" />
            <Bar className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 rounded-xl bg-surface p-5 shadow-card">
        {Array.from({ length: 5 }, (_, i) => (
          <Bar key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

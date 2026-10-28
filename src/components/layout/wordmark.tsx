import { cn } from "@/lib/utils";

/** Nome provisório "TecDesk" em texto, com o quadradinho no degradê verde. Ainda não há logo. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-xl font-bold tracking-[-0.03em] text-ink", className)}>
      <i aria-hidden className="size-2.5 rounded-[3px] bg-brand-gradient" />
      TecDesk
    </span>
  );
}

import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-[13px] text-ink-subtle">404</p>
        <h1 className="mt-2 text-[22px] leading-7 font-semibold">Página não encontrada</h1>
        <p className="mt-1 text-[13px] text-ink-subtle">O endereço pode ter mudado ou não existir mais.</p>
        <ButtonLink href="/dashboard" variant="dark" className="mt-6">
          Ir para o Dashboard
        </ButtonLink>
      </div>
    </main>
  );
}

import { LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

function initials(email?: string | null) {
  if (!email) return "TD";
  return email.slice(0, 2).toUpperCase();
}

/** Rodapé do menu: avatar, e-mail, tema e sair. */
export function UserBox({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-muted p-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-ink">
        {initials(email)}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{email ?? "Sem login"}</span>
      <ThemeToggle />
      {email ? (
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label="Sair"
            className="inline-grid size-9 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      ) : null}
    </div>
  );
}

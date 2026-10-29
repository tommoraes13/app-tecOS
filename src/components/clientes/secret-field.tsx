"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { revelarSenha } from "@/app/(app)/clientes/actions";

const iconBtn =
  "inline-grid size-9 shrink-0 place-items-center rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink lg:size-8";

async function copiar(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Campo de senha no formulário do equipamento.
 * value undefined = senha salva mantida; ao clicar em mostrar, busca a senha e passa a editar.
 */
export function SecretInput({
  id,
  equipamentoId,
  campo,
  saved,
  value,
  onChange,
}: {
  id: string;
  equipamentoId?: string;
  campo: string;
  saved: boolean;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load(): Promise<string | null> {
    if (value !== undefined) return value;
    if (!saved || !equipamentoId) return "";
    setLoading(true);
    const r = await revelarSenha(equipamentoId, campo);
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      return null;
    }
    onChange(r.data);
    return r.data;
  }

  return (
    <div>
      <div className="flex h-11 items-center gap-1 rounded-md border border-border-control bg-surface pr-1 pl-3 focus-within:border-focus-ring focus-within:shadow-[0_0_0_3px_var(--brand-100)] lg:h-10">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value ?? ""}
          placeholder={saved && value === undefined ? "•••••••• (salva)" : ""}
          onChange={(e) => {
            setError(null);
            onChange(e.target.value);
          }}
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none"
        />
        {loading ? <Loader2 className="mx-2 size-4 animate-spin text-ink-subtle" /> : null}
        <button
          type="button"
          className={iconBtn}
          aria-label={visible ? "Esconder senha" : "Mostrar senha"}
          onClick={async () => {
            if (!visible && (await load()) === null) return;
            setVisible((v) => !v);
          }}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          className={iconBtn}
          aria-label="Copiar senha"
          onClick={async () => {
            const v = await load();
            if (v && (await copiar(v))) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

/** Senha na ficha do equipamento (só leitura): mascarada, com mostrar e copiar. */
export function SecretValue({ equipamentoId, campo }: { equipamentoId: string; campo: string }) {
  const [plain, setPlain] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    if (plain !== null) return plain;
    setLoading(true);
    const r = await revelarSenha(equipamentoId, campo);
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      return null;
    }
    setPlain(r.data);
    return r.data;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="truncate font-mono text-[13px]">{visible && plain !== null ? plain : "••••••••"}</span>
      {loading ? <Loader2 className="size-3.5 animate-spin text-ink-subtle" /> : null}
      <button
        type="button"
        className="inline-grid size-7 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink"
        aria-label={visible ? "Esconder senha" : "Mostrar senha"}
        onClick={async () => {
          if (!visible && (await load()) === null) return;
          setVisible((v) => !v);
        }}
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      <button
        type="button"
        className="inline-grid size-7 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink"
        aria-label="Copiar senha"
        onClick={async () => {
          const v = await load();
          if (v && (await copiar(v))) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        }}
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </span>
  );
}

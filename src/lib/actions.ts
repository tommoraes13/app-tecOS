import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

/** Cliente do Supabase + usuário logado, para Server Actions. */
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) throw new Error("Sua sessão expirou. Entre de novo.");
  return { supabase, user: { id } };
}

type DbError = { code?: string; message?: string; details?: string } | null | undefined;

/** Traduz erros do banco para mensagens que o técnico entende. */
export function dbMessage(error: DbError, fallback = "Não foi possível salvar agora. Tente de novo.") {
  if (!error) return fallback;
  if (error.code === "23505") {
    const m = `${error.message ?? ""} ${error.details ?? ""}`;
    if (m.includes("numero")) return "Já existe um documento com esse número. Use outro.";
    if (m.includes("codigo")) return "Já existe um item com esse código. Use outro.";
    return "Esse registro já existe.";
  }
  if (error.code === "23503") return "Esse item está ligado a outro registro e não pode ser alterado assim.";
  if (error.code === "23514") return "Algum valor está fora do permitido. Confira os campos.";
  if (error.message?.includes("orçamento já virou")) return "Este orçamento já virou atendimento.";
  return fallback;
}

export function fail(error: unknown, fallback?: string): { ok: false; error: string } {
  if (error instanceof Error && error.message.startsWith("Sua sessão")) return { ok: false, error: error.message };
  return { ok: false, error: dbMessage(error as DbError, fallback) };
}

/** Texto vazio vira null; tira espaços das pontas. */
export function txt(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

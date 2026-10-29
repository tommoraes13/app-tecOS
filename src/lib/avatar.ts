import { supabaseUrl } from "@/lib/supabase/env";

/** Endereço público da foto de perfil guardada na pasta "avatars". */
export function avatarUrl(path: string | null | undefined) {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
}

export function initials(name: string | null | undefined, email?: string | null) {
  const base = (name ?? "").trim();
  if (base) {
    const parts = base.split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
  }
  return (email ?? "TD").slice(0, 2).toUpperCase();
}

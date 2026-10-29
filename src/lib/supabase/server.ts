import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { hasSupabaseEnv, supabaseKey, supabaseUrl } from "./env";

/** Cliente do Supabase para Server Components, Server Actions e Route Handlers. */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component: o middleware renova a sessão.
        }
      },
    },
  });
  return client as unknown as SupabaseClient<Database>;
}

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
};

/**
 * Usuário logado, ou null (inclusive quando o Supabase ainda não foi configurado).
 * Confere o login localmente e reaproveita o resultado na mesma página (layout + página).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!hasSupabaseEnv) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: c.sub,
    email: typeof c.email === "string" ? c.email : null,
    name: typeof meta.name === "string" ? meta.name : null,
  };
});

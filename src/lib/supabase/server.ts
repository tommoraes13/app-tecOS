import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
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

/** Usuário logado, ou null (inclusive quando o Supabase ainda não foi configurado). */
export async function getCurrentUser() {
  if (!hasSupabaseEnv) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

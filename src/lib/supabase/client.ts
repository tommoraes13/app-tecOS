import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseKey, supabaseUrl } from "./env";

/** Cliente do Supabase para componentes que rodam no navegador. */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient(supabaseUrl, supabaseKey) as unknown as SupabaseClient<Database>;
}

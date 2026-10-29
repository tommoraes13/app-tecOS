import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseKey, supabaseUrl } from "./env";

/** Cliente do Supabase para componentes que rodam no navegador. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./env";

/** Cliente do Supabase para componentes que rodam no navegador. */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

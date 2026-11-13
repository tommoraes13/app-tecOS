import { cache } from "react";
import { avatarUrl } from "@/lib/avatar";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  email: string | null;
  nome: string | null;
  fotoUrl: string | null;
  fotoPath: string | null;
  idioma: string;
  moeda: string;
  fuso: string;
  sairApos24h: boolean;
  /** Login atual (segundos desde 1970), se o Supabase informar. */
  loginEm: number | null;
};

/** Usuário logado + preferências da conta, reaproveitado na mesma página. */
export const getPerfil = cache(async (): Promise<Perfil | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("perfil").select("*").maybeSingle();
  return {
    id: user.id,
    email: user.email,
    nome: data?.nome_exibicao ?? user.name,
    fotoUrl: avatarUrl(data?.foto_path),
    fotoPath: data?.foto_path ?? null,
    idioma: data?.idioma ?? "pt-BR",
    moeda: data?.moeda ?? "BRL",
    fuso: data?.fuso ?? "America/Sao_Paulo",
    sairApos24h: data?.sair_apos_24h ?? false,
    loginEm: user.loginEm,
  };
});

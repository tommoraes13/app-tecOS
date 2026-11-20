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
  /** celular da conta (pessoal); o do negócio fica em Meu Negócio */
  telefone: string | null;
  /** conta nova: abre o passo a passo de primeiro acesso */
  primeiroAcesso: boolean;
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
    telefone: data?.telefone ?? null,
    primeiroAcesso: data?.primeiro_acesso_pendente ?? false,
  };
});

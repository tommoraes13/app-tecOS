"use server";

import { revalidatePath } from "next/cache";
import { fail, num, numOrNull, requireUser, txt, type ActionResult } from "@/lib/actions";
import { onlyDigits } from "@/lib/format";

export type EmpresaInput = {
  nome_fantasia: string;
  razao_social: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  regiao_atendimento_km: number | null;
  garantia_meses_padrao: number;
};

export async function salvarEmpresa(input: EmpresaInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("meu_negocio")
      .update({
        nome_fantasia: txt(input.nome_fantasia),
        razao_social: txt(input.razao_social),
        cpf_cnpj: txt(onlyDigits(input.cpf_cnpj)),
        email: txt(input.email),
        telefone: txt(onlyDigits(input.telefone)),
        cep: txt(onlyDigits(input.cep)),
        endereco: txt(input.endereco),
        numero: txt(input.numero),
        complemento: txt(input.complemento),
        bairro: txt(input.bairro),
        cidade: txt(input.cidade),
        estado: txt(input.estado),
        regiao_atendimento_km: numOrNull(input.regiao_atendimento_km),
        garantia_meses_padrao: Math.max(0, Math.min(120, Math.round(num(input.garantia_meses_padrao, 3)))),
      })
      .eq("user_id", user.id);
    if (error) return fail(error);
    revalidatePath("/meu-negocio");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { fail, num, requireUser, txt, type ActionResult } from "@/lib/actions";
import { metodoComVisita, metodoValido } from "@/lib/documento";
import { onlyDigits } from "@/lib/format";

export type PrimeiroAcessoInput = {
  nome: string;
  celular: string;
  negocio: string;
  telefone_negocio: string;
  cpf_cnpj: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo_precificacao: string;
  valor_visita: number;
  valor_hora: number;
};

/** Fim do passo a passo: grava os dados da pessoa e do negócio e libera o app. */
export async function concluirPrimeiroAcesso(f: PrimeiroAcessoInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const nome = txt(f.nome);
    const negocio = txt(f.negocio);
    const celular = onlyDigits(f.celular);
    if (!nome) return { ok: false, error: "Informe seu nome." };
    if (celular.length < 10) return { ok: false, error: "Informe um celular com DDD." };
    if (!negocio) return { ok: false, error: "Informe o nome do seu negócio." };
    const metodo = metodoValido(f.tipo_precificacao);
    const n = await supabase
      .from("meu_negocio")
      .update({
        nome_fantasia: negocio.slice(0, 120),
        telefone: onlyDigits(f.telefone_negocio).slice(0, 30) || celular,
        cpf_cnpj: txt(f.cpf_cnpj),
        cep: onlyDigits(f.cep) || null,
        endereco: txt(f.endereco),
        numero: txt(f.numero),
        complemento: txt(f.complemento),
        bairro: txt(f.bairro),
        cidade: txt(f.cidade),
        estado: txt(f.estado),
        tipo_precificacao: metodo,
        cobrar_visita: metodoComVisita(metodo),
        valor_visita: num(f.valor_visita),
        valor_hora: num(f.valor_hora),
      })
      .eq("user_id", user.id);
    if (n.error) return fail(n.error);
    const p = await supabase
      .from("perfil")
      .update({ nome_exibicao: nome.slice(0, 120), telefone: celular.slice(0, 30), primeiro_acesso_pendente: false })
      .eq("user_id", user.id);
    if (p.error) return fail(p.error);
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

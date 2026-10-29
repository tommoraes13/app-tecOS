"use server";

import { revalidatePath } from "next/cache";
import { fail, num, numOrNull, requireUser, txt, type ActionResult } from "@/lib/actions";
import { onlyDigits } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

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
      })
      .eq("user_id", user.id);
    if (error) return fail(error);
    revalidatePath("/meu-negocio");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export type PrecificacaoInput = {
  tipo_precificacao: string;
  valor_visita: number;
  duracao_visita_min: number;
  cobrar_visita: boolean;
  valor_km: number;
};

export async function salvarPrecificacao(input: PrecificacaoInput): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("meu_negocio")
      .update({
        tipo_precificacao: txt(input.tipo_precificacao),
        valor_visita: num(input.valor_visita),
        duracao_visita_min: Math.max(0, Math.round(num(input.duracao_visita_min, 60))),
        cobrar_visita: Boolean(input.cobrar_visita),
        valor_km: num(input.valor_km),
      })
      .eq("user_id", user.id);
    if (error) return fail(error);
    revalidatePath("/meu-negocio");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export type ServicoInput = {
  id?: string;
  nome: string;
  codigo: string;
  categoria: Enums<"servico_categoria"> | "";
  tamanho_backup: string;
  localizacao_pastas: string;
  valor: number;
  tempo_medio_min: number | null;
  tipo_equipamento: string;
};

export async function salvarServico(input: ServicoInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireUser();
    if (!txt(input.nome)) return { ok: false, error: "Informe o nome do serviço." };
    const isBackup = input.categoria === "backup_recuperacao";
    const row = {
      nome: input.nome.trim(),
      codigo: txt(input.codigo),
      categoria: input.categoria || null,
      tamanho_backup: isBackup ? txt(input.tamanho_backup) : null,
      localizacao_pastas: isBackup ? txt(input.localizacao_pastas) : null,
      valor: num(input.valor),
      tempo_medio_min: numOrNull(input.tempo_medio_min),
      tipo_equipamento: txt(input.tipo_equipamento),
    };
    const query = input.id
      ? supabase.from("cadastro_servicos").update(row).eq("id", input.id).select("id").single()
      : supabase.from("cadastro_servicos").insert(row).select("id").single();
    const { data, error } = await query;
    if (error || !data) return fail(error);
    revalidatePath("/meu-negocio");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirServicos(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("cadastro_servicos").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/meu-negocio");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export type ProdutoInput = {
  id?: string;
  nome: string;
  codigo: string;
  valor_custo: number | null;
  valor_venda: number;
};

export async function salvarProduto(input: ProdutoInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireUser();
    if (!txt(input.nome)) return { ok: false, error: "Informe o nome do produto." };
    const row = {
      nome: input.nome.trim(),
      codigo: txt(input.codigo),
      valor_custo: numOrNull(input.valor_custo),
      valor_venda: num(input.valor_venda),
    };
    const query = input.id
      ? supabase.from("cadastro_produtos").update(row).eq("id", input.id).select("id").single()
      : supabase.from("cadastro_produtos").insert(row).select("id").single();
    const { data, error } = await query;
    if (error || !data) return fail(error);
    revalidatePath("/meu-negocio");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirProdutos(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("cadastro_produtos").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/meu-negocio");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

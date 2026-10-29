"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, txt, type ActionResult } from "@/lib/actions";
import { decrypt, encrypt, hasEncryptionKey } from "@/lib/crypto";
import type { Enums, Json, Tables } from "@/lib/database.types";
import { CAMPOS, type Specs, type TipoEquipamento } from "@/lib/equipamentos";
import { onlyDigits } from "@/lib/format";

export type ClienteInput = {
  id?: string;
  nome: string;
  telefone: string;
  email: string;
  canal: Enums<"cliente_canal"> | "";
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
};

export async function salvarCliente(input: ClienteInput): Promise<ActionResult<Tables<"base_clientes">>> {
  try {
    const { supabase } = await requireUser();
    if (!txt(input.nome)) return { ok: false, error: "Informe o nome do cliente." };
    if (onlyDigits(input.telefone).length < 10) return { ok: false, error: "Informe um telefone com DDD." };
    const row = {
      nome: input.nome.trim(),
      telefone: onlyDigits(input.telefone),
      email: txt(input.email),
      canal: input.canal || null,
      cep: txt(onlyDigits(input.cep)),
      endereco: txt(input.endereco),
      numero: txt(input.numero),
      complemento: txt(input.complemento),
      bairro: txt(input.bairro),
      cidade: txt(input.cidade),
      estado: txt(input.estado),
      observacoes: txt(input.observacoes),
    };
    const { data, error } = input.id
      ? await supabase.from("base_clientes").update(row).eq("id", input.id).select("*").single()
      : await supabase.from("base_clientes").insert(row).select("*").single();
    if (error || !data) return fail(error);
    revalidatePath("/clientes");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirClientes(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("base_clientes").delete().in("id", ids);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/clientes");
    revalidatePath("/servicos");
    revalidatePath("/orcamentos");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

export type EquipamentoInput = {
  id?: string;
  cliente_id: string;
  tipo: TipoEquipamento;
  nome: string;
  specs: Specs;
  /** undefined = manter a senha salva; "" = apagar; texto = nova senha */
  senhas: Record<string, string | undefined>;
  estado_geral: Enums<"equipamento_estado"> | "";
  estado_detalhe: string;
};

export type EquipamentoSalvo = Tables<"base_equipamentos">;

export async function salvarEquipamento(input: EquipamentoInput): Promise<ActionResult<EquipamentoSalvo>> {
  try {
    const { supabase } = await requireUser();
    if (!txt(input.nome)) return { ok: false, error: "Informe o nome do equipamento." };

    const campos = CAMPOS[input.tipo];
    if (!campos) return { ok: false, error: "Escolha o tipo de equipamento." };

    for (const c of campos) {
      if (!c.required || (c.showIf && !c.showIf(input.specs))) continue;
      const v = input.specs[c.key];
      if (typeof v !== "string" || !v.trim()) return { ok: false, error: `Preencha "${c.label}".` };
    }

    // Só guarda os campos do tipo escolhido.
    const specs: Record<string, string | boolean> = {};
    for (const c of campos) {
      if (c.kind === "secret") continue;
      const v = input.specs[c.key];
      if (c.kind === "toggle") specs[c.key] = v === true;
      else if (typeof v === "string" && v.trim()) specs[c.key] = v.trim();
    }
    // SSID 5G segue o 2.4G quando não for informado.
    if (input.tipo === "rede" && !specs.ssid_5 && typeof specs.ssid_24 === "string") specs.ssid_5 = specs.ssid_24;

    // Senhas: parte das já salvas e aplica as mudanças.
    let senhas: Record<string, string> = {};
    if (input.id) {
      const { data: atual } = await supabase.from("base_equipamentos").select("senhas").eq("id", input.id).single();
      if (atual?.senhas && typeof atual.senhas === "object" && !Array.isArray(atual.senhas)) {
        for (const [k, v] of Object.entries(atual.senhas)) if (typeof v === "string") senhas[k] = v;
      }
    }
    const secretKeys = new Set(campos.filter((c) => c.kind === "secret").map((c) => c.key));
    for (const [k, v] of Object.entries(input.senhas)) {
      if (!secretKeys.has(k) || v === undefined) continue;
      if (v === "") {
        delete senhas[k];
        continue;
      }
      if (!hasEncryptionKey()) {
        return {
          ok: false,
          error: "As senhas ainda não podem ser salvas: falta configurar a chave de criptografia na Vercel.",
        };
      }
      senhas[k] = encrypt(v);
    }
    senhas = Object.fromEntries(Object.entries(senhas).filter(([k]) => secretKeys.has(k)));

    const row = {
      cliente_id: input.cliente_id,
      tipo: input.tipo,
      nome: input.nome.trim(),
      especificacoes: specs as Json,
      senhas: senhas as Json,
      estado_geral: input.estado_geral || null,
      estado_detalhe: input.estado_geral ? txt(input.estado_detalhe) : null,
    };

    const { data, error } = input.id
      ? await supabase.from("base_equipamentos").update(row).eq("id", input.id).select("*").single()
      : await supabase.from("base_equipamentos").insert(row).select("*").single();
    if (error || !data) return fail(error);
    revalidatePath("/clientes");
    // O texto cifrado não precisa ir para o navegador.
    return { ok: true, data: { ...data, senhas: Object.fromEntries(Object.keys(senhas).map((k) => [k, "•"])) } };
  } catch (e) {
    return fail(e);
  }
}

export async function excluirEquipamento(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("base_equipamentos").delete().eq("id", id);
    if (error) return fail(error, "Não foi possível excluir agora.");
    revalidatePath("/clientes");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

/** Mostra uma senha salva. A leitura passa pelas regras do banco: só o dono do equipamento consegue. */
export async function revelarSenha(equipamentoId: string, campo: string): Promise<ActionResult<string>> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.from("base_equipamentos").select("senhas").eq("id", equipamentoId).single();
    if (error || !data) return fail(error, "Equipamento não encontrado.");
    const senhas = data.senhas;
    const stored =
      senhas && typeof senhas === "object" && !Array.isArray(senhas) ? (senhas as Record<string, Json>)[campo] : null;
    if (typeof stored !== "string") return { ok: false, error: "Nenhuma senha salva neste campo." };
    if (!hasEncryptionKey()) return { ok: false, error: "Falta configurar a chave de criptografia na Vercel." };
    const plain = decrypt(stored);
    if (plain === null) return { ok: false, error: "Não foi possível ler esta senha. A chave de criptografia mudou?" };
    return { ok: true, data: plain };
  } catch (e) {
    return fail(e);
  }
}

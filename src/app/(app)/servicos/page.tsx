import { createClient } from "@/lib/supabase/server";
import { ServicosList, type OsLinha } from "./servicos-list";
import { pageTitle } from "@/i18n/server";

export const generateMetadata = pageTitle("Serviços Prestados");

export default async function ServicosPage() {
  const supabase = await createClient();
  const [os, cl, itens, cat] = await Promise.all([
    supabase
      .from("base_atendimentos")
      .select("id, numero, status, data_inicio, data_entrega, valor_total, valor_recebido, recebido, data_recebimento, cliente_id, relato")
      .order("data_inicio", { ascending: false })
      .order("numero", { ascending: false })
      .limit(1000),
    supabase.from("base_clientes").select("id, nome, telefone"),
    supabase.from("os_servicos").select("os_id, servico_id, descricao"),
    supabase.from("cadastro_servicos").select("id, categoria"),
  ]);
  const clientes = new Map((cl.data ?? []).map((c) => [c.id, c]));
  const categoria = new Map((cat.data ?? []).map((c) => [c.id, c.categoria]));
  const porOs = new Map<string, { descricoes: string[]; categorias: Set<string> }>();
  for (const i of itens.data ?? []) {
    const entry = porOs.get(i.os_id) ?? { descricoes: [], categorias: new Set<string>() };
    entry.descricoes.push(i.descricao);
    const c = i.servico_id ? categoria.get(i.servico_id) : null;
    if (c) entry.categorias.add(c);
    porOs.set(i.os_id, entry);
  }

  const linhas: OsLinha[] = (os.data ?? []).map((o) => {
    const c = o.cliente_id ? clientes.get(o.cliente_id) : undefined;
    const extra = porOs.get(o.id);
    return {
      ...o,
      cliente: c?.nome ?? null,
      telefone: c?.telefone ?? null,
      servicos: extra?.descricoes ?? [],
      categorias: [...(extra?.categorias ?? [])],
    };
  });

  return <ServicosList linhas={linhas} />;
}

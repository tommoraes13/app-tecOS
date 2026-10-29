"use server";

import { fail, requireUser, type ActionResult } from "@/lib/actions";
import { OS_STATUS } from "@/components/ui/status-badge";
import { addMonthsISO, date, docNumber, money } from "@/lib/format";
import { carregarPdf, type PdfItem } from "@/lib/pdf/dados";

function linhas(titulo: string, itens: PdfItem[], semValores: boolean) {
  if (itens.length === 0) return [];
  return [
    `*${titulo}*`,
    ...itens.map((i) => {
      const qtd = i.quantidade !== 1 ? `${String(i.quantidade).replace(".", ",")}x ` : "";
      return semValores ? `• ${qtd}${i.descricao}` : `• ${qtd}${i.descricao} - ${money(i.quantidade * i.valor_unitario)}`;
    }),
    "",
  ];
}

/** Texto pronto para enviar a OS ou o orçamento pelo WhatsApp (o técnico pode editar antes de enviar). */
export async function gerarMensagemWhatsapp(
  tipo: "os" | "orcamento",
  id: string,
): Promise<ActionResult<{ texto: string; telefone: string | null; cliente: string | null }>> {
  try {
    const { supabase } = await requireUser();
    const d = await carregarPdf(supabase, tipo, id);
    if (!d) return { ok: false, error: "Documento não encontrado." };

    const empresa = d.negocio?.nome_fantasia || d.negocio?.razao_social || "";
    const primeiroNome = d.cliente?.nome.split(" ")[0] ?? "";
    const isOS = tipo === "os";
    const doc = `${isOS ? "OS" : "orçamento"} nº ${docNumber(d.numero)}`;
    const sem = d.totalManual;

    const partes: string[] = [
      `Olá${primeiroNome ? `, ${primeiroNome}` : ""}! Tudo bem?`,
      "",
      isOS
        ? `Segue o resumo da sua ${doc}${empresa ? ` com a ${empresa}` : ""}:`
        : `Segue o ${doc}${empresa ? ` da ${empresa}` : ""}, como combinamos:`,
      "",
    ];
    if (d.equipamentos.length) partes.push(`*Equipamento:* ${d.equipamentos.map((e) => e.nome).join(", ")}`, "");
    partes.push(...linhas("Serviços", d.servicos, sem), ...linhas("Produtos", d.produtos, sem));
    if (!sem && d.visita) partes.push(`Visita técnica: ${money(d.visita)}`);
    if (!sem && d.frete) partes.push(`Frete: ${money(d.frete)}`);
    if (!sem && d.desconto) partes.push(`Desconto: - ${money(d.desconto)}`);
    partes.push(`*Total: ${money(d.total)}*`, "");

    if (isOS) {
      if (d.status) partes.push(`Situação: ${OS_STATUS[d.status].label}`);
      if (d.recebido) partes.push(`Recebido: ${money(d.recebido.valor)}${d.recebido.data ? ` em ${date(d.recebido.data)}` : ""}`);
      if (d.garantiaMeses && d.dataEntrega) {
        partes.push(
          `Garantia: ${d.garantiaMeses} ${d.garantiaMeses === 1 ? "mês" : "meses"}, até ${date(addMonthsISO(d.dataEntrega, d.garantiaMeses))}`,
        );
      } else if (d.garantiaMeses) {
        partes.push(`Garantia: ${d.garantiaMeses} ${d.garantiaMeses === 1 ? "mês" : "meses"} a partir da entrega`);
      }
      partes.push("", "Qualquer dúvida, estou à disposição.");
    } else {
      if (d.garantiaMeses) partes.push(`Garantia: ${d.garantiaMeses} ${d.garantiaMeses === 1 ? "mês" : "meses"}`);
      partes.push("", "Para aprovar, é só responder esta mensagem. Qualquer dúvida, estou à disposição.");
    }

    return {
      ok: true,
      data: { texto: partes.join("\n").replace(/\n{3,}/g, "\n\n").trim(), telefone: d.cliente?.telefone ?? null, cliente: d.cliente?.nome ?? null },
    };
  } catch (e) {
    return fail(e, "Não foi possível montar a mensagem agora.");
  }
}

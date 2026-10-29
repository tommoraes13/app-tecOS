"use server";

import { OS_STATUS } from "@/lib/status";
import type { Fmt } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import type { T } from "@/i18n/translate";
import { fail, requireUser, type ActionResult } from "@/lib/actions";
import { addMonthsISO, docNumber } from "@/lib/format";
import { carregarPdf, type PdfItem } from "@/lib/pdf/dados";

function linhas(titulo: string, itens: PdfItem[], semValores: boolean, fmt: Fmt) {
  if (itens.length === 0) return [];
  return [
    `*${titulo}*`,
    ...itens.map((i) => {
      const qtd = i.quantidade !== 1 ? `${fmt.number(i.quantidade, 2)}x ` : "";
      return semValores ? `• ${qtd}${i.descricao}` : `• ${qtd}${i.descricao} - ${fmt.money(i.quantidade * i.valor_unitario)}`;
    }),
    "",
  ];
}

const meses = (n: number, t: T) => (n === 1 ? t("1 mês") : t("{n} meses", { n }));

/** Texto pronto para enviar a OS ou o orçamento pelo WhatsApp, no idioma do técnico (ele pode editar antes de enviar). */
export async function gerarMensagemWhatsapp(
  tipo: "os" | "orcamento",
  id: string,
): Promise<ActionResult<{ texto: string; telefone: string | null; cliente: string | null }>> {
  try {
    const { supabase } = await requireUser();
    const { t, fmt } = await getI18n();
    const d = await carregarPdf(supabase, tipo, id, t);
    if (!d) return { ok: false, error: "Documento não encontrado." };

    const empresa = d.negocio?.nome_fantasia || d.negocio?.razao_social || "";
    const primeiroNome = d.cliente?.nome.split(" ")[0] ?? "";
    const isOS = tipo === "os";
    const numero = docNumber(d.numero);
    const sem = d.totalManual;

    const partes: string[] = [
      primeiroNome ? t("Olá, {nome}! Tudo bem?", { nome: primeiroNome }) : t("Olá! Tudo bem?"),
      "",
      isOS
        ? empresa
          ? t("Segue o resumo da sua OS nº {n} com a {empresa}:", { n: numero, empresa })
          : t("Segue o resumo da sua OS nº {n}:", { n: numero })
        : empresa
          ? t("Segue o orçamento nº {n} da {empresa}, como combinamos:", { n: numero, empresa })
          : t("Segue o orçamento nº {n}, como combinamos:", { n: numero }),
      "",
    ];
    if (d.equipamentos.length) partes.push(`*${t("Equipamento")}:* ${d.equipamentos.map((e) => e.nome).join(", ")}`, "");
    partes.push(...linhas(t("Serviços"), d.servicos, sem, fmt), ...linhas(t("Produtos"), d.produtos, sem, fmt));
    if (!sem && d.visita) partes.push(`${t("Visita técnica")}: ${fmt.money(d.visita)}`);
    if (!sem && d.frete) partes.push(`${t("Frete")}: ${fmt.money(d.frete)}`);
    if (!sem && d.desconto) partes.push(`${t("Desconto")}: - ${fmt.money(d.desconto)}`);
    partes.push(`*${t("Total")}: ${fmt.money(d.total)}*`, "");

    if (isOS) {
      if (d.status) partes.push(`${t("Situação")}: ${t(OS_STATUS[d.status].label)}`);
      if (d.recebido) {
        partes.push(
          d.recebido.data
            ? t("Recebido: {valor} em {data}", { valor: fmt.money(d.recebido.valor), data: fmt.date(d.recebido.data) })
            : t("Recebido: {valor}", { valor: fmt.money(d.recebido.valor) }),
        );
      }
      if (d.garantiaMeses && d.dataEntrega) {
        partes.push(
          t("Garantia: {meses}, até {data}", {
            meses: meses(d.garantiaMeses, t),
            data: fmt.date(addMonthsISO(d.dataEntrega, d.garantiaMeses)),
          }),
        );
      } else if (d.garantiaMeses) {
        partes.push(t("Garantia: {meses} a partir da entrega", { meses: meses(d.garantiaMeses, t) }));
      }
      partes.push("", t("Qualquer dúvida, estou à disposição."));
    } else {
      if (d.garantiaMeses) partes.push(`${t("Garantia")}: ${meses(d.garantiaMeses, t)}`);
      partes.push("", t("Para aprovar, é só responder esta mensagem. Qualquer dúvida, estou à disposição."));
    }

    return {
      ok: true,
      data: {
        texto: partes.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
        telefone: d.cliente?.telefone ?? null,
        cliente: d.cliente?.nome ?? null,
      },
    };
  } catch (e) {
    return fail(e, "Não foi possível montar a mensagem agora.");
  }
}

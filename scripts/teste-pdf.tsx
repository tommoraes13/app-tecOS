/**
 * Teste da geração de PDF com dados de exemplo (roda na verificação automática).
 * Uso: npx tsx scripts/teste-pdf.tsx [saida.pdf]
 */
import { writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { PdfDados } from "../src/lib/pdf/dados";
import { DocumentoPDF } from "../src/lib/pdf/documento-pdf";

const base = {
  id: "x",
  user_id: "u",
  created_at: "",
  updated_at: "",
};

const dados: PdfDados = {
  tipo: "os",
  numero: 42,
  data: "2026-10-28",
  status: "aguardando_pagamento",
  negocio: {
    user_id: "u",
    nome_fantasia: "Técnico Ágil Informática",
    razao_social: "João da Silva ME",
    cpf_cnpj: "12345678000190",
    email: "contato@exemplo.com",
    telefone: "11981234501",
    cep: "01310100",
    endereco: "Avenida Paulista",
    numero: "1000",
    complemento: "Sala 12",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    regiao_atendimento_km: 20,
    logo_url: null,
    tipo_precificacao: "por_servico",
    valor_visita: 60,
    duracao_visita_min: 60,
    cobrar_visita: true,
    valor_km: 0,
    created_at: "",
    updated_at: "",
  },
  cliente: {
    ...base,
    nome: "Maria Souza",
    telefone: "11977001288",
    email: "maria@exemplo.com",
    canal: "indicacao",
    cep: "04538133",
    endereco: "Rua Funchal",
    numero: "200",
    complemento: null,
    bairro: "Vila Olímpia",
    cidade: "São Paulo",
    estado: "SP",
    observacoes: null,
  },
  relato: "Computador muito lento e com pop-ups. Precisa manter os arquivos da pasta Documentos.",
  observacoes: "Garantia de 90 dias para o serviço de formatação.",
  equipamentos: [{ nome: "PC Escritório", detalhe: "Desktop · Ryzen 5 5600G · Windows 11" }],
  visitas: [{ data: "2026-10-28", hora: "14:30", duracao_min: 120 }],
  servicos: [
    { descricao: "Formatação com backup", quantidade: 1, valor_unitario: 180, equipamento: "PC Escritório" },
    { descricao: "Limpeza interna e troca de pasta térmica", quantidade: 1, valor_unitario: 120, equipamento: null },
  ],
  produtos: [{ descricao: "SSD 480 GB", quantidade: 1, valor_unitario: 220, equipamento: "PC Escritório" }],
  despesas: [{ label: "Deslocamento", valor: 30 }],
  visita: 60,
  total: 610,
  totalManual: false,
  dataEntrega: "2026-10-29",
  recebido: { valor: 300, data: "2026-10-29" },
};

async function main() {
  const saida = process.argv[2] ?? "teste-os.pdf";
  for (const variante of [dados, { ...dados, tipo: "orcamento" as const, status: null, totalManual: true, recebido: null }]) {
    const el = createElement(DocumentoPDF, { d: variante, geradoEm: "29/10/2026 às 10:00" });
    const buf = await renderToBuffer(el as unknown as Parameters<typeof renderToBuffer>[0]);
    if (buf.length < 2000 || buf.subarray(0, 4).toString() !== "%PDF") throw new Error("PDF inválido");
    console.log(`${variante.tipo}: ${buf.length} bytes`);
    if (variante.tipo === "os") writeFileSync(saida, buf);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

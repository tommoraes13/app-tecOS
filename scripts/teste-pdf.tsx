/**
 * Teste da geração de PDF com dados de exemplo (roda na verificação automática).
 * Uso: npx tsx scripts/teste-pdf.tsx [saida.pdf]
 */
import { writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentoPDF } from "../src/lib/pdf/documento-pdf";
import { dados } from "./pdf-exemplo";

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

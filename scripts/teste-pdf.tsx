/**
 * Teste da geração de PDF com dados de exemplo (roda na verificação automática).
 * Uso: npx tsx scripts/teste-pdf.tsx [saida.pdf]
 */
import { writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createFormat } from "../src/i18n/format";
import en from "../src/i18n/messages/en";
import { createT } from "../src/i18n/translate";
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
  // Mesmo documento em inglês e em dólar.
  const el = createElement(DocumentoPDF, {
    d: dados,
    geradoEm: "10/29/2026 at 10:00 AM",
    t: createT(en),
    fmt: createFormat({ locale: "en", currency: "USD", timeZone: "America/New_York" }),
  });
  const buf = await renderToBuffer(el as unknown as Parameters<typeof renderToBuffer>[0]);
  if (buf.subarray(0, 4).toString() !== "%PDF") throw new Error("PDF em inglês inválido");
  console.log(`os (en): ${buf.length} bytes`);
  writeFileSync(saida.replace(/\.pdf$/, "-en.pdf"), buf);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Teste da geração de PDF com dados de exemplo (roda na verificação automática).
 * Uso: npx tsx scripts/teste-pdf.tsx [saida.pdf]
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createFormat } from "../src/i18n/format";
import en from "../src/i18n/messages/en";
import { createT } from "../src/i18n/translate";
import { DocumentoPDF } from "../src/lib/pdf/documento-pdf";
import { dados } from "./pdf-exemplo";

/** PNG quadrado de uma cor só, para testar o logotipo no PDF sem depender de arquivo. */
function pngSolido(lado: number, [r, g, b]: [number, number, number]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const x of buf) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (tipo: string, dados: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(dados.length);
    const td = Buffer.concat([Buffer.from(tipo), dados]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const linha = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: lado }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: lado }, () => linha));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main() {
  const saida = process.argv[2] ?? "teste-os.pdf";
  for (const variante of [dados, { ...dados, tipo: "orcamento" as const, status: null, totalManual: true, recebido: null }]) {
    const logo = { data: pngSolido(64, [11, 95, 134]), format: "png" as const };
    const el = createElement(DocumentoPDF, { d: variante, geradoEm: "29/10/2026 às 10:00", logo });
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

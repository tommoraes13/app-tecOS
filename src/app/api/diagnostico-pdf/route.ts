// Rota TEMPORÁRIA de diagnóstico: gera um PDF com dados de exemplo (nada do banco).
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentoPDF } from "@/lib/pdf/documento-pdf";
import { dados } from "../../../../scripts/pdf-exemplo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const el = createElement(DocumentoPDF, { d: dados, geradoEm: "teste" });
    const buf = await renderToBuffer(el as unknown as Parameters<typeof renderToBuffer>[0]);
    return new Response(`OK ${buf.length} bytes`, { headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    const err = e as Error;
    return new Response(`ERRO: ${err?.name}: ${err?.message}\n${err?.stack ?? ""}`, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
}

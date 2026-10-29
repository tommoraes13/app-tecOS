// Copiada para src/app/api/teste-pdf/route.ts só durante a verificação automática.
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentoPDF } from "@/lib/pdf/documento-pdf";
import { dados } from "../../../../scripts/pdf-exemplo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const el = createElement(DocumentoPDF, { d: dados, geradoEm: "teste" });
  const buf = await renderToBuffer(el as unknown as Parameters<typeof renderToBuffer>[0]);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf" } });
}

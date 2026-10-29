// Rota TEMPORÁRIA de diagnóstico: gera um PDF com dados de exemplo (nada do banco).
import { createElement } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const etapas: string[] = [];
  try {
    const rp = await import("@react-pdf/renderer");
    etapas.push("renderer carregado");
    const { DocumentoPDF } = await import("@/lib/pdf/documento-pdf");
    const { dados } = await import("../../../../scripts/pdf-exemplo");
    etapas.push("documento carregado");
    const el = createElement(DocumentoPDF, { d: dados, geradoEm: "teste" });
    const buf = await rp.renderToBuffer(el as unknown as Parameters<typeof rp.renderToBuffer>[0]);
    return new Response(`OK ${buf.length} bytes\n${etapas.join("\n")}`, { headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    const err = e as Error;
    return new Response(`ERRO depois de [${etapas.join(", ")}]: ${err?.name}: ${err?.message}\n${err?.stack ?? ""}`, {
      headers: { "Content-Type": "text/plain" },
    });
  }
}

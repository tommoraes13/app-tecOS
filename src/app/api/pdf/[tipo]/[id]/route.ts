import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { date, docNumber, todayISO } from "@/lib/format";
import { carregarPdf } from "@/lib/pdf/dados";
import { DocumentoPDF } from "@/lib/pdf/documento-pdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/pdf/os/<id> ou /api/pdf/orcamento/<id>. Com ?baixar=1 o navegador baixa em vez de abrir. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== "os" && tipo !== "orcamento") return new NextResponse("Documento inválido", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const dados = await carregarPdf(supabase, tipo, id);
  if (!dados) return new NextResponse("Documento não encontrado", { status: 404 });

  const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date());
  const element = createElement(DocumentoPDF, { d: dados, geradoEm: `${date(todayISO())} às ${hora}` });
  const buffer = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);

  const nome = `${tipo === "os" ? "OS" : "Orcamento"}-${docNumber(dados.numero)}.pdf`;
  const baixar = request.nextUrl.searchParams.has("baixar");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

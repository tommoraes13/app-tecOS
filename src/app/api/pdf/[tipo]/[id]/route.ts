import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { getI18n } from "@/i18n/server";
import { avatarUrl } from "@/lib/avatar";
import { docNumber } from "@/lib/format";
import { carregarPdf } from "@/lib/pdf/dados";
import { DocumentoPDF } from "@/lib/pdf/documento-pdf";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/pdf/os/<id> ou /api/pdf/orcamento/<id>. Com ?baixar=1 o navegador baixa em vez de abrir. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== "os" && tipo !== "orcamento") return new NextResponse("Documento inválido", { status: 404 });

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { t, fmt } = await getI18n();
  const dados = await carregarPdf(supabase, tipo, id, t);
  if (!dados) return new NextResponse(t("Documento não encontrado."), { status: 404 });

  const geradoEm = t("{data} às {hora}", { data: fmt.date(fmt.today()), hora: fmt.time(new Date()) });
  const logo = await baixarLogo(dados.negocio?.logo_url ?? null);
  const element = createElement(DocumentoPDF, { d: dados, geradoEm, t, fmt, logo });
  const buffer = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);

  const nome = `${tipo === "os" ? t("OS") : t("Orcamento@@arquivo")}-${docNumber(dados.numero)}.pdf`;
  const baixar = request.nextUrl.searchParams.has("baixar");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${encodeURIComponent(nome)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Baixa o logotipo do negócio para o PDF. Se falhar ou demorar, o PDF sai sem ele. */
async function baixarLogo(path: string | null): Promise<{ data: Buffer; format: "png" | "jpg" } | null> {
  const url = avatarUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const tipo = res.headers.get("content-type") ?? "";
    const format = tipo.includes("png") ? "png" : tipo.includes("jpeg") || tipo.includes("jpg") ? "jpg" : null;
    if (!format) return null;
    return { data: Buffer.from(await res.arrayBuffer()), format };
  } catch {
    return null;
  }
}

/** Assinaturas (empresa e cliente): imagens PNG na pasta privada "assinaturas" do técnico. */
export const BUCKET_ASSINATURAS = "assinaturas";

/** Recorta o espaço vazio em volta do traço e devolve um PNG com fundo transparente. */
export async function recortarAssinatura(origem: HTMLCanvasElement, margem = 12): Promise<Blob | null> {
  const ctx = origem.getContext("2d");
  if (!ctx) return null;
  const { width: w, height: h } = origem;
  const px = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null; // nada desenhado
  x0 = Math.max(0, x0 - margem);
  y0 = Math.max(0, y0 - margem);
  x1 = Math.min(w - 1, x1 + margem);
  y1 = Math.min(h - 1, y1 + margem);
  // Limita a 900 px de largura para o arquivo ficar pequeno.
  const escala = Math.min(1, 900 / (x1 - x0 + 1));
  const out = document.createElement("canvas");
  out.width = Math.round((x1 - x0 + 1) * escala);
  out.height = Math.round((y1 - y0 + 1) * escala);
  out.getContext("2d")?.drawImage(origem, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, out.width, out.height);
  return new Promise((ok) => out.toBlob((b) => ok(b), "image/png"));
}

/**
 * Imagem enviada (foto ou arquivo da assinatura): tira o fundo claro, deixa o traço escuro
 * e recorta, para sair limpa no PDF.
 */
export async function prepararAssinaturaEnviada(file: File): Promise<Blob | null> {
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, 1200 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * escala);
  c.height = Math.round(bmp.height * escala);
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const luz = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Fundo (claro) vira transparente; o traço fica azul-escuro com a opacidade proporcional.
    const alfa = d[i + 3] === 0 ? 0 : Math.max(0, Math.min(255, (200 - luz) * 2.2));
    d[i] = 20;
    d[i + 1] = 30;
    d[i + 2] = 70;
    d[i + 3] = alfa;
  }
  ctx.putImageData(img, 0, 0);
  return recortarAssinatura(c);
}

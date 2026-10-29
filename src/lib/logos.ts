/**
 * 20 logotipos simples e minimalistas, desenhados na hora com as iniciais do negócio.
 * 5 formas × 4 combinações de cor. Saem em PNG 512×512 (o PDF aceita PNG).
 */
export const TOTAL_LOGOS = 20;

const PALETAS = [
  { fundo: "#0b5f86", fundo2: "#16244a", letra: "#ffffff" },
  { fundo: "#127049", fundo2: "#0a3a2a", letra: "#ffffff" },
  { fundo: "#0f1a14", fundo2: "#26302b", letra: "#f2c063" },
  { fundo: "#b04a0b", fundo2: "#7a2e05", letra: "#ffffff" },
];

type Forma = "circulo" | "quadrado" | "hexagono" | "escudo" | "anel";
const FORMAS: Forma[] = ["circulo", "quadrado", "hexagono", "escudo", "anel"];

export function iniciaisDoNegocio(nome: string | null | undefined) {
  const partes = (nome ?? "").trim().split(/\s+/).filter((p) => p.length > 2 || /^[A-Z0-9]/.test(p));
  if (!partes.length) return "TD";
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : partes[0].slice(0, 2);
  return letras.toUpperCase();
}

function caminho(ctx: CanvasRenderingContext2D, forma: Forma, n: number) {
  const c = n / 2;
  ctx.beginPath();
  if (forma === "circulo" || forma === "anel") {
    ctx.arc(c, c, n * 0.46, 0, Math.PI * 2);
  } else if (forma === "quadrado") {
    const r = n * 0.2;
    const m = n * 0.06;
    ctx.roundRect(m, m, n - 2 * m, n - 2 * m, r);
  } else if (forma === "hexagono") {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const x = c + n * 0.46 * Math.cos(a);
      const y = c + n * 0.46 * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else {
    // escudo
    ctx.moveTo(n * 0.12, n * 0.1);
    ctx.lineTo(n * 0.88, n * 0.1);
    ctx.lineTo(n * 0.88, n * 0.5);
    ctx.quadraticCurveTo(n * 0.88, n * 0.82, c, n * 0.94);
    ctx.quadraticCurveTo(n * 0.12, n * 0.82, n * 0.12, n * 0.5);
    ctx.closePath();
  }
}

/** Desenha o logotipo número `indice` (0 a 19) num canvas quadrado. */
export function desenharLogo(canvas: HTMLCanvasElement, indice: number, iniciais: string) {
  const n = 512;
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const forma = FORMAS[indice % FORMAS.length];
  const cor = PALETAS[Math.floor(indice / FORMAS.length) % PALETAS.length];
  ctx.clearRect(0, 0, n, n);

  const grad = ctx.createLinearGradient(0, 0, n, n);
  grad.addColorStop(0, cor.fundo);
  grad.addColorStop(1, cor.fundo2);
  caminho(ctx, forma, n);
  if (forma === "anel") {
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = n * 0.07;
    ctx.strokeStyle = grad;
    caminho(ctx, forma, n);
    ctx.stroke();
  } else {
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Detalhe discreto: um ponto de destaque no canto (lembra um LED/indicador).
  ctx.beginPath();
  ctx.arc(n * 0.72, n * 0.3, n * 0.035, 0, Math.PI * 2);
  ctx.fillStyle = forma === "anel" ? cor.fundo : cor.letra;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;

  const texto = iniciais.slice(0, 2);
  ctx.fillStyle = forma === "anel" ? cor.fundo : cor.letra;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${texto.length > 1 ? n * 0.34 : n * 0.42}px Inter, "Segoe UI", system-ui, sans-serif`;
  ctx.fillText(texto, n / 2, forma === "escudo" ? n * 0.5 : n * 0.53);
}

export function canvasParaPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png"));
}

/** Logo enviado pela pessoa: reduz para no máximo 512 px (sem cortar) e salva em PNG. */
export async function prepararLogoEnviado(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasParaPng(canvas);
}

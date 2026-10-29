import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabase.replace(/^https:/, "wss:");
const dev = process.env.NODE_ENV !== "production";

/**
 * Política de conteúdo: o navegador só carrega scripts, estilos e imagens do próprio app,
 * do Supabase (dados e fotos), do ViaCEP e do Photon/OpenStreetMap (busca de endereço). Ninguém pode exibir o app dentro de outro site.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabaseWs} https://viacep.com.br https://photon.komoot.io`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Gerador de PDF roda só no servidor, fora do empacotamento.
  serverExternalPackages: ["@react-pdf/renderer"],
  // As fontes padrão do PDF (Helvetica) são lidas em tempo de execução e a Vercel não as incluía
  // no pacote da função: o PDF falhava em produção. Aqui forçamos a inclusão.
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/@react-pdf/pdfkit/**/*.afm",
      "./node_modules/@react-pdf/pdfkit/**/*.cjs",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

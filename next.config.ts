import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Gerador de PDF roda só no servidor, fora do empacotamento.
  serverExternalPackages: ["@react-pdf/renderer"],
  // As fontes padrão do PDF (Helvetica) são lidas em tempo de execução e a Vercel não as incluía
  // no pacote da função: o PDF falhava em produção. Aqui forçamos a inclusão.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/pdfkit/js/standard-fonts/**/*", "./node_modules/@react-pdf/pdfkit/**/*.afm", "./node_modules/@react-pdf/pdfkit/**/*.cjs"],
  },
};

export default nextConfig;

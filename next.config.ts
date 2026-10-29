import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Gerador de PDF roda só no servidor, fora do empacotamento.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;

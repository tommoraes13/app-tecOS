import type { MetadataRoute } from "next";

/** Permite "instalar" o app no celular a partir do link (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TecDesk",
    short_name: "TecDesk",
    description: "Gestão de atendimentos para técnicos de informática.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f3f5f4",
    theme_color: "#0a3a2a",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

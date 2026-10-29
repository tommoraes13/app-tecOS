import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getI18n } from "@/i18n/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "TecDesk", template: "%s · TecDesk" },
    description: t("Gestão de atendimentos para técnicos de informática."),
    applicationName: "TecDesk",
    appleWebApp: { capable: true, title: "TecDesk", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b100d" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { prefs, dict } = await getI18n();
  return (
    <html lang={prefs.locale} suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <Providers prefs={prefs} dict={dict}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

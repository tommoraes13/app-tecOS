"use client";

import { ThemeProvider } from "next-themes";
import type { Prefs } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import type { Dict } from "@/i18n/translate";

export function Providers({ prefs, dict, children }: { prefs: Prefs; dict: Dict | null; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider prefs={prefs} dict={dict}>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}

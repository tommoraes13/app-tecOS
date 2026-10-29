import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-[13px] text-ink-subtle">404</p>
        <h1 className="mt-2 text-[22px] leading-7 font-semibold">{t("Página não encontrada")}</h1>
        <p className="mt-1 text-[13px] text-ink-subtle">{t("O endereço pode ter mudado ou não existir mais.")}</p>
        <ButtonLink href="/dashboard" variant="dark" className="mt-6">
          {t("Ir para o Dashboard")}
        </ButtonLink>
      </div>
    </main>
  );
}

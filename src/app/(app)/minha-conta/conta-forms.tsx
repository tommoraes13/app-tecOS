"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ContaForms() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (senha.length < 6) return setMsg({ kind: "error", text: t("A nova senha precisa ter pelo menos 6 caracteres.") });
    if (senha !== confirma) return setMsg({ kind: "error", text: t("As duas senhas não são iguais.") });
    setPending(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setPending(false);
    if (error) {
      const same = error.message.toLowerCase().includes("different");
      return setMsg({
        kind: "error",
        text: same ? t("A nova senha precisa ser diferente da atual.") : t("Não foi possível trocar a senha agora. Tente de novo."),
      });
    }
    setSenha("");
    setConfirma("");
    setMsg({ kind: "ok", text: t("Senha alterada.") });
  }

  const temas = [
    { value: "light", label: t("Claro@@tema"), icon: Sun },
    { value: "dark", label: t("Escuro"), icon: Moon },
    { value: "system", label: t("Igual ao aparelho"), icon: Monitor },
  ];

  return (
    <>
      <Card className="grid gap-3 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">{t("Aparência")}</h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("Tema")}>
          {temas.map((tema) => {
            const active = mounted && theme === tema.value;
            const Icon = tema.icon;
            return (
              <button
                key={tema.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(tema.value)}
                className={cn(
                  "flex h-12 items-center gap-2 rounded-lg border px-3 text-sm font-medium",
                  active ? "border-brand-700 bg-brand-100 text-brand-ink" : "border-border text-ink-muted hover:bg-surface-muted",
                )}
              >
                <Icon className="size-4" />
                {tema.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <form onSubmit={trocarSenha} className="grid gap-3">
          <h2 className="text-[15px] font-semibold">{t("Trocar senha")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("Nova senha")} htmlFor="nova" hint={t("Mínimo de 6 caracteres")}>
              <Input id="nova" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </Field>
            <Field label={t("Repita a nova senha")} htmlFor="conf">
              <Input id="conf" type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
            </Field>
          </div>
          {msg ? <Feedback kind={msg.kind}>{msg.text}</Feedback> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="dark" disabled={pending} className="w-full sm:w-auto">
              {pending ? t("Salvando…") : t("Trocar senha")}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

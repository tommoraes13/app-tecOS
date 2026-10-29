"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ContaForms() {
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
    if (senha.length < 6) return setMsg({ kind: "error", text: "A nova senha precisa ter pelo menos 6 caracteres." });
    if (senha !== confirma) return setMsg({ kind: "error", text: "As duas senhas não são iguais." });
    setPending(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setPending(false);
    if (error) {
      const same = error.message.toLowerCase().includes("different");
      return setMsg({
        kind: "error",
        text: same ? "A nova senha precisa ser diferente da atual." : "Não foi possível trocar a senha agora. Tente de novo.",
      });
    }
    setSenha("");
    setConfirma("");
    setMsg({ kind: "ok", text: "Senha alterada." });
  }

  const temas = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Igual ao aparelho", icon: Monitor },
  ];

  return (
    <>
      <Card className="grid gap-3 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">Aparência</h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tema">
          {temas.map((t) => {
            const active = mounted && theme === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex h-12 items-center gap-2 rounded-lg border px-3 text-sm font-medium",
                  active ? "border-brand-700 bg-brand-100 text-brand-ink" : "border-border text-ink-muted hover:bg-surface-muted",
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <form onSubmit={trocarSenha} className="grid gap-3">
          <h2 className="text-[15px] font-semibold">Trocar senha</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nova senha" htmlFor="nova" hint="Mínimo de 6 caracteres">
              <Input id="nova" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </Field>
            <Field label="Repita a nova senha" htmlFor="conf">
              <Input id="conf" type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
            </Field>
          </div>
          {msg ? <Feedback kind={msg.kind}>{msg.text}</Feedback> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="dark" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Salvando…" : "Trocar senha"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

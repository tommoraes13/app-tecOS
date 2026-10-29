"use client";

import { useState } from "react";
import { Check, Copy, Loader2, MessageCircle } from "lucide-react";
import { gerarMensagemWhatsapp } from "@/app/(app)/servicos/whatsapp-action";
import { Button } from "@/components/ui/button";
import { Feedback, Textarea } from "@/components/ui/controls";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";
import { phone, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Botão "Mensagem para WhatsApp": prévia editável, copiar e enviar para o WhatsApp do cliente. */
export function WhatsappButton({ tipo, id, className }: { tipo: "os" | "orcamento"; id: string; className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState("");
  const [telefone, setTelefone] = useState<string | null>(null);
  const [cliente, setCliente] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function abrir() {
    setOpen(true);
    setErro(null);
    setLoading(true);
    const r = await gerarMensagemWhatsapp(tipo, id);
    setLoading(false);
    if (!r.ok) return setErro(t(r.error));
    setTexto(r.data.texto);
    setTelefone(r.data.telefone);
    setCliente(r.data.cliente);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setErro(t("Não foi possível copiar. Selecione o texto e copie manualmente."));
    }
  }

  const link = whatsappLink(telefone);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-success-bg px-3 text-[13px] font-medium text-success hover:opacity-90",
          className,
        )}
      >
        <MessageCircle className="size-4" />
        {t("Mensagem para WhatsApp")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("Mensagem para WhatsApp")}
        footer={
          <>
            <Button variant="outline" onClick={copiar} disabled={loading || !texto} icon={copiado ? <Check /> : <Copy />}>
              {copiado ? t("Copiado") : t("Copiar texto")}
            </Button>
            {link ? (
              <a
                href={`${link}?text=${encodeURIComponent(texto)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-medium text-on-action lg:h-10"
              >
                <MessageCircle className="size-4" />
                {cliente ? t("Enviar para {nome}", { nome: cliente.split(" ")[0] }) : t("Enviar para o cliente")}
              </a>
            ) : (
              <Button variant="dark" disabled>
                {t("Cliente sem WhatsApp")}
              </Button>
            )}
          </>
        }
      >
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-ink-subtle">
            <Loader2 className="size-4 animate-spin" /> {t("Montando a mensagem…")}
          </p>
        ) : (
          <div className="grid gap-2">
            <p className="text-[13px] text-ink-subtle">
              {telefone ? t("Vai para {tel}.", { tel: phone(telefone) }) : t("Este cliente não tem telefone cadastrado.")}{" "}
              {t("Você pode editar o texto antes de enviar.")}
            </p>
            <Textarea
              aria-label={t("Texto da mensagem")}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-72 font-mono text-[13px] leading-5"
            />
            {erro ? <Feedback kind="error">{erro}</Feedback> : null}
          </div>
        )}
      </Modal>
    </>
  );
}

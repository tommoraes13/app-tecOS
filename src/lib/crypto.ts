import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Criptografia das senhas dos equipamentos (AES-256-GCM).
 * A chave fica só na Vercel (EQUIPMENT_SECRET_KEY, 32 bytes em base64); o banco guarda apenas o texto cifrado.
 * Formato salvo: "v1:<iv>:<tag>:<cifra>" (base64).
 */

function key(): Buffer | null {
  const raw = process.env.EQUIPMENT_SECRET_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export function hasEncryptionKey() {
  return key() !== null;
}

export function encrypt(plain: string): string {
  const k = key();
  if (!k) throw new Error("SEM_CHAVE");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
}

export function decrypt(stored: string): string | null {
  const k = key();
  if (!k) return null;
  const [v, iv, tag, data] = stored.split(":");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

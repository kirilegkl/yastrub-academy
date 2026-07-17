import crypto from "crypto";

/**
 * MONOBANK — два способа оплаты.
 *
 * A) БАНКА (jar): просто ведём пользователя на ссылку банки. Подтверждение оплаты
 *    полуавтоматическое (кнопка «я оплатив» + подтверждение админом в мини-админке).
 *
 * B) ACQUIRING API: создаём invoice и принимаем вебхук с проверкой подписи.
 *    Включается, если задан MONO_ACQUIRING_TOKEN.
 */

export function jarUrl(comment?: string): string {
  const base = process.env.MONO_JAR_URL || "https://send.monobank.ua/jar/PLACEHOLDER";
  if (!comment) return base;
  // Некоторые ссылки банки принимают ?t= как текст назначения — безопасно добавляем.
  const u = new URL(base);
  u.searchParams.set("t", comment);
  return u.toString();
}

export function acquiringEnabled(): boolean {
  return Boolean(process.env.MONO_ACQUIRING_TOKEN);
}

type InvoiceResult = { invoiceId: string; pageUrl: string };

/** Создание invoice через monobank Acquiring API. amount — в гривнах. */
export async function createInvoice(params: {
  amountUah: number;
  reference: string; // наш enrollmentId
  destination: string; // назначение платежа (текст)
  redirectUrl: string;
  webHookUrl: string;
}): Promise<InvoiceResult> {
  const token = process.env.MONO_ACQUIRING_TOKEN;
  if (!token) throw new Error("MONO_ACQUIRING_TOKEN is not set");

  const res = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Token": token },
    body: JSON.stringify({
      amount: Math.round(params.amountUah * 100), // копейки
      ccy: 980, // UAH
      merchantPaymInfo: {
        reference: params.reference,
        destination: params.destination,
      },
      redirectUrl: params.redirectUrl,
      webHookUrl: params.webHookUrl,
      validity: 3600,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`monobank invoice/create failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as InvoiceResult;
}

/** Получение публичного ключа мерчанта (кэшируется в памяти процесса). */
let cachedPubKey: string | null = null;
export async function getMerchantPubKey(): Promise<string> {
  if (cachedPubKey) return cachedPubKey;
  const token = process.env.MONO_ACQUIRING_TOKEN;
  if (!token) throw new Error("MONO_ACQUIRING_TOKEN is not set");
  const res = await fetch("https://api.monobank.ua/api/merchant/pubkey", {
    headers: { "X-Token": token },
  });
  if (!res.ok) throw new Error(`pubkey fetch failed: ${res.status}`);
  const data = (await res.json()) as { key: string };
  cachedPubKey = Buffer.from(data.key, "base64").toString("utf8");
  return cachedPubKey;
}

/** Проверка подписи X-Sign вебхука monobank (ECDSA SHA256 по сырому телу). */
export async function verifyWebhookSignature(rawBody: string, xSign: string): Promise<boolean> {
  try {
    const pubKey = await getMerchantPubKey();
    const verify = crypto.createVerify("SHA256");
    verify.update(rawBody);
    verify.end();
    return verify.verify(pubKey, Buffer.from(xSign, "base64"));
  } catch {
    return false;
  }
}

import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

/** Время жизни эфемерной страницы сертификата, секунд. */
export const EPHEMERAL_TTL_SECONDS = 60;

/**
 * Создаёт новую одноминутную сессию просмотра для сертификата по его постоянному qrToken.
 * Возвращает sessionToken (или null, если сертификат не найден).
 * Каждый скан QR порождает НОВУЮ сессию — старые истекают сами по времени.
 */
export async function createEphemeralSession(qrToken: string): Promise<string | null> {
  const cert = await prisma.certificate.findUnique({ where: { qrToken } });
  if (!cert) return null;

  // мягкий rate-limit: не даём наплодить слишком много живых сессий на один сертификат
  const now = new Date();
  const liveCount = await prisma.certEphemeralSession.count({
    where: { certificateId: cert.id, expiresAt: { gt: now } },
  });
  if (liveCount > 20) {
    // чистим просроченные и всё равно продолжаем
    await cleanupExpiredSessions();
  }

  const sessionToken = nanoid(32);
  const expiresAt = new Date(now.getTime() + EPHEMERAL_TTL_SECONDS * 1000);
  await prisma.certEphemeralSession.create({
    data: { certificateId: cert.id, sessionToken, expiresAt },
  });
  return sessionToken;
}

/**
 * Возвращает сертификат по живой сессии, либо null если сессия истекла/не существует.
 * Это и есть проверка "страница жива?".
 */
export async function resolveLiveSession(sessionToken: string) {
  const session = await prisma.certEphemeralSession.findUnique({
    where: { sessionToken },
    include: { certificate: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  return { session, certificate: session.certificate };
}

/** Удаляет все просроченные сессии (вызывать по cron / фоново). */
export async function cleanupExpiredSessions(): Promise<number> {
  const res = await prisma.certEphemeralSession.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return res.count;
}

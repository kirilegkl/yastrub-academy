import { prisma } from "@/lib/db";

/**
 * Отправляет пользователю сообщение в Telegram напрямую через Bot API
 * (если у него уже привязан tgChatId). Бот и сайт делят одну БД, но для
 * мгновенного пуша проще дёрнуть sendMessage.
 */
export async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

/** Уведомить об успешной оплате и открыть доступ. */
export async function notifyBotPaid(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: true, course: true },
  });
  if (!enrollment?.user.tgChatId) return;

  const isEn = enrollment.user.locale === "en";
  const title = isEn ? enrollment.course.titleEn : enrollment.course.titleUa;
  const text = isEn
    ? `✅ Payment confirmed. Access to the course “${title}” is now open. Send /courses to view materials.`
    : `✅ Оплату підтверджено. Доступ до курсу «${title}» відкрито. Надішліть /courses, щоб переглянути матеріали.`;

  await sendTelegram(enrollment.user.tgChatId, text);
}

/**
 * Отправляет сообщение в бот ADMIN YASTRUB (заявки з сайту).
 * Использует отдельный токен ADMIN_BOT_TOKEN и чат ADMIN_CHAT_ID.
 * Возвращает true, если реально отправлено.
 */
export async function sendAdminTelegram(text: string): Promise<boolean> {
  const token = process.env.ADMIN_BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

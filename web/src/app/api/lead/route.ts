import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendAdminTelegram } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  phone: z.string().min(5).max(30),
  name: z.string().max(120).optional().nullable(),
  source: z.string().max(40).optional(),
  locale: z.enum(["uk", "en"]).default("uk"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const data = parsed.data;

  // 1) зберігаємо лід у БД (щоб нічого не втрачалось, навіть якщо бот ще не налаштований)
  const lead = await prisma.lead.create({
    data: {
      phone: data.phone.trim(),
      name: data.name?.trim() || null,
      source: data.source || "hero",
      locale: data.locale,
    },
  });

  // 2) надсилаємо в бот ADMIN YASTRUB (якщо задані ADMIN_BOT_TOKEN + ADMIN_CHAT_ID)
  const text =
    `🔔 <b>Нова заявка з сайту</b>\n` +
    `📞 Телефон: <b>${escapeHtml(lead.phone)}</b>\n` +
    (lead.name ? `👤 Ім'я: ${escapeHtml(lead.name)}\n` : "") +
    `🌐 Джерело: ${escapeHtml(lead.source)}\n` +
    `🕒 ${lead.createdAt.toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}`;

  const sent = await sendAdminTelegram(text);
  if (sent) {
    await prisma.lead.update({ where: { id: lead.id }, data: { notified: true } });
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { jarUrl, acquiringEnabled, createInvoice } from "@/lib/monobank";
import { sendAdminTelegram } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  courseId: z.string().min(1),
  instructorId: z.string().min(1).nullable().optional(),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  tgUsername: z.string().max(64).optional().nullable(),
  locale: z.enum(["uk", "en"]).default("uk"),
});

function normalizeTg(v?: string | null): string | null {
  if (!v) return null;
  const s = v.trim().replace(/^@/, "");
  return s ? s : null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: data.courseId } });
  if (!course || !course.isActive) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }

  // instructor должен быть привязан к курсу (если задан)
  let instructorId: string | null = null;
  if (data.instructorId) {
    const link = await prisma.courseInstructor.findUnique({
      where: { courseId_instructorId: { courseId: course.id, instructorId: data.instructorId } },
    });
    if (link) instructorId = data.instructorId;
  }

  const linkToken = nanoid(24);

  // Email не уникален (человек может брать несколько курсов) — ручной find/create.
  // Всегда генерим свежий linkToken для привязки бота к этому пользователю.
  const existing = await prisma.user.findFirst({ where: { email: data.email } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          tgUsername: normalizeTg(data.tgUsername),
          locale: data.locale,
          linkToken,
        },
      })
    : await prisma.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          tgUsername: normalizeTg(data.tgUsername),
          locale: data.locale,
          linkToken,
        },
      });

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: user.id,
      courseId: course.id,
      instructorId,
      status: "pending_payment",
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "your_bot";
  const botLink = `https://t.me/${botUsername}?start=${linkToken}`;

  // Способ оплаты
  let payUrl = jarUrl(`Курс: ${course.titleUa} #${enrollment.id}`);
  let method = "jar";
  let ref: string | null = enrollment.id;

  if (acquiringEnabled()) {
    try {
      const inv = await createInvoice({
        amountUah: course.price,
        reference: enrollment.id,
        destination: `Курс «${course.titleUa}»`,
        redirectUrl: `${appUrl}/?paid=1`,
        webHookUrl: `${appUrl}/api/payments/monobank/webhook`,
      });
      payUrl = inv.pageUrl;
      method = "acquiring";
      ref = inv.invoiceId;
    } catch (e) {
      console.error("acquiring failed, fallback to jar:", e);
    }
  }

  await prisma.payment.create({
    data: {
      enrollmentId: enrollment.id,
      provider: "monobank",
      method,
      amount: course.price,
      currency: course.currency,
      ref,
      status: "created",
    },
  });

  // Лог у бот ADMIN: нова реєстрація на курс (не блокує відповідь клієнту).
  const tgLine = normalizeTg(data.tgUsername);
  void sendAdminTelegram(
    `🎯 <b>Нова реєстрація на курс</b>\n` +
      `Курс: <b>${course.titleUa}</b> — ${course.price} грн\n` +
      `ПІБ: ${data.fullName}\n` +
      `Телефон: ${data.phone}\n` +
      `Email: ${data.email}\n` +
      `Telegram: ${tgLine ? "@" + tgLine : "—"}\n` +
      `Оплата: ${method}\n` +
      `ID: ${enrollment.id}`
  );

  return NextResponse.json({
    enrollmentId: enrollment.id,
    jarUrl: payUrl,
    botLink,
  });
}

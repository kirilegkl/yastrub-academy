import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { notifyBotPaid } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Подтверждение оплаты по банке (jar) вручную админом → enrollment = paid.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.enrollment.update({ where: { id }, data: { status: "paid" } }),
    prisma.payment.updateMany({
      where: { enrollmentId: id, status: "created" },
      data: { status: "success" },
    }),
  ]);

  // Уведомить бота (если у пользователя уже привязан chat_id).
  await notifyBotPaid(id).catch((e) => console.error("notifyBotPaid failed:", e));

  return NextResponse.json({ ok: true, status: "paid" });
}

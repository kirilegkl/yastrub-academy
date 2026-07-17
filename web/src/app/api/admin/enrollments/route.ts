import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Список заявок для мини-админки.
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const enrollments = await prisma.enrollment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: true,
      course: true,
      instructor: true,
      certificate: true,
      payments: true,
    },
  });

  return NextResponse.json({
    enrollments: enrollments.map((e: (typeof enrollments)[number]) => ({
      id: e.id,
      status: e.status,
      createdAt: e.createdAt,
      user: { fullName: e.user.fullName, email: e.user.email, phone: e.user.phone, tg: e.user.tgUsername, tgLinked: Boolean(e.user.tgChatId) },
      course: e.course.titleUa,
      instructor: e.instructor?.fullName ?? "—",
      amount: e.payments[0]?.amount ?? e.course.price,
      paymentMethod: e.payments[0]?.method ?? "jar",
      certNumber: e.certificate?.certNumber ?? null,
      certUrl: e.certificate ? `/cert/${e.certificate.qrToken}` : null,
    })),
  });
}

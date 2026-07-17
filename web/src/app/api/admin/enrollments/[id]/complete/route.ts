import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { createCertificateForEnrollment } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Отметка о прохождении курса → enrollment = completed + генерация сертификата.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.enrollment.update({
    where: { id },
    data: { status: "completed", completedAt: new Date() },
  });

  const cert = await createCertificateForEnrollment(id);
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return NextResponse.json({
    ok: true,
    status: "completed",
    certificate: {
      certNumber: cert.certNumber,
      qrToken: cert.qrToken,
      url: `${appUrl}/cert/${cert.qrToken}`,
    },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/monobank";
import { notifyBotPaid } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Вебхук monobank Acquiring. Идемпотентность по invoiceId (payment.ref).
export async function POST(req: Request) {
  const raw = await req.text();
  const xSign = req.headers.get("x-sign") || "";

  const ok = await verifyWebhookSignature(raw, xSign);
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  let payload: { invoiceId?: string; status?: string; reference?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const invoiceId = payload.invoiceId;
  if (!invoiceId) return NextResponse.json({ error: "no invoiceId" }, { status: 400 });

  const payment = await prisma.payment.findFirst({ where: { ref: invoiceId } });
  if (!payment) return NextResponse.json({ ok: true }); // не наш invoice — молча ок

  if (payload.status === "success" && payment.status !== "success") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "success", rawPayload: payload },
      }),
      prisma.enrollment.update({ where: { id: payment.enrollmentId }, data: { status: "paid" } }),
    ]);
    await notifyBotPaid(payment.enrollmentId).catch((e) => console.error(e));
  } else if (payload.status === "failure" || payload.status === "expired") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", rawPayload: payload },
    });
  }

  return NextResponse.json({ ok: true });
}

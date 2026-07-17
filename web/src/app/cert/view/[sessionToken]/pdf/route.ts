import { NextResponse } from "next/server";
import { resolveLiveSession } from "@/lib/ephemeral";
import { generateCertificatePdf } from "@/lib/cert-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Генерация PDF сертификата НА ЛЕТУ по шаблону (шапка + ФИО + QR).
 * Доступно только пока эфемерная сессия жива.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ sessionToken: string }> }) {
  const { sessionToken } = await params;
  const live = await resolveLiveSession(sessionToken);
  if (!live) {
    return new NextResponse("Термін дії сторінки минув / Page expired", {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cert = live.certificate;
  const appUrl = process.env.APP_URL || "";
  const verifyUrl = `${appUrl}/cert/${cert.qrToken}`;

  const pdf = await generateCertificatePdf({
    holderFullName: cert.holderFullName,
    courseTitle: cert.courseTitle,
    instructorName: cert.instructorName,
    certNumber: cert.certNumber,
    issuedAt: cert.issuedAt,
    verifyUrl,
    locale: "uk",
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${cert.certNumber}.pdf"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

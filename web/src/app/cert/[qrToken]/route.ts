import { NextResponse } from "next/server";
import { createEphemeralSession } from "@/lib/ephemeral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Точка входа QR-кода. Каждый скан СОЗДАЁТ новую одноминутную сессию просмотра
 * и редиректит на неё. Сам qrToken постоянный (QR не «сгорает»), а конкретная
 * страница живёт 60 секунд.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = await params;
  const sessionToken = await createEphemeralSession(qrToken);

  const appUrl = process.env.APP_URL || "";
  const base = appUrl || new URL(_req.url).origin;

  if (!sessionToken) {
    return NextResponse.redirect(`${base}/cert/invalid`, { status: 302 });
  }

  const res = NextResponse.redirect(`${base}/cert/view/${sessionToken}`, { status: 302 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

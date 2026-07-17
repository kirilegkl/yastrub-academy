import { resolveLiveSession, EPHEMERAL_TTL_SECONDS } from "@/lib/ephemeral";
import { qrDataUrl } from "@/lib/qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Эфемерная страница сертификата: рендерится только пока сессия жива (≤60 c).
export default async function CertViewPage({
  params,
}: {
  params: Promise<{ sessionToken: string }>;
}) {
  const { sessionToken } = await params;
  const live = await resolveLiveSession(sessionToken);

  if (!live) {
    return (
      <main style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.gone}>⌛</div>
          <h1 style={styles.title}>Термін дії сторінки минув</h1>
          <p style={styles.muted}>
            Сторінка сертифіката існує лише {EPHEMERAL_TTL_SECONDS} секунд. Відскануйте QR-код ще
            раз, щоб відкрити нову.
          </p>
          <p style={{ ...styles.muted, marginTop: 8 }}>
            This certificate page has expired. Please scan the QR code again.
          </p>
        </div>
      </main>
    );
  }

  const cert = live.certificate;
  const appUrl = process.env.APP_URL || "";
  const verifyUrl = `${appUrl}/cert/${cert.qrToken}`;
  const qr = await qrDataUrl(verifyUrl);
  const secondsLeft = Math.max(
    0,
    Math.round((live.session.expiresAt.getTime() - Date.now()) / 1000)
  );
  const issued = cert.issuedAt.toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.badge}>ДІЙСНИЙ · VALID</div>
        <h1 style={styles.title}>СЕРТИФІКАТ</h1>
        <p style={styles.subtitle}>про проходження курсу стрілецької підготовки</p>

        <div style={styles.name}>{cert.holderFullName}</div>
        <p style={styles.muted}>успішно пройшов(ла) курс</p>
        <div style={styles.course}>«{cert.courseTitle}»</div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR" width={160} height={160} style={styles.qr} />

        <div style={styles.meta}>
          <div>Інструктор: {cert.instructorName}</div>
          <div>№ сертифіката: {cert.certNumber}</div>
          <div>Дата видачі: {issued}</div>
        </div>

        <a href={`/cert/view/${sessionToken}/pdf`} style={styles.pdf}>
          Завантажити PDF
        </a>

        <p style={styles.timer}>
          Ця сторінка зникне через ~{secondsLeft} с · This page expires in ~{secondsLeft}s
        </p>
      </div>
      <meta name="robots" content="noindex,nofollow" />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0f0c",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "linear-gradient(180deg,#121a14,#0f160f)",
    border: "1px solid #26362a",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
    color: "#e9f0ea",
  },
  badge: {
    display: "inline-block",
    fontFamily: "ui-monospace,monospace",
    fontSize: 11,
    letterSpacing: 2,
    color: "#0b0f0c",
    background: "#8fbf4d",
    padding: "4px 10px",
    borderRadius: 999,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 900, color: "#c6ff5e", margin: 0, letterSpacing: 2 },
  subtitle: { color: "#8ba090", fontSize: 13, marginTop: 4 },
  name: { fontSize: 26, fontWeight: 800, marginTop: 24 },
  course: { fontSize: 20, fontWeight: 700, color: "#c6ff5e", marginTop: 4 },
  qr: { margin: "24px auto 8px", display: "block", borderRadius: 8, background: "#fff", padding: 8 },
  meta: {
    fontSize: 13,
    color: "#8ba090",
    marginTop: 12,
    display: "grid",
    gap: 4,
    fontFamily: "ui-monospace,monospace",
  },
  pdf: {
    display: "inline-block",
    marginTop: 20,
    background: "#8fbf4d",
    color: "#0b0f0c",
    fontWeight: 700,
    padding: "10px 20px",
    borderRadius: 10,
    textDecoration: "none",
  },
  timer: { marginTop: 16, fontSize: 11, color: "#6f8574", fontFamily: "ui-monospace,monospace" },
  gone: { fontSize: 48 },
  muted: { color: "#8ba090", fontSize: 14, marginTop: 8 },
};

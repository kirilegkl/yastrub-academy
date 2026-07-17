import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { qrPngBuffer } from "@/lib/qr";

/**
 * Генерация PDF-сертификата ПО ШАБЛОНУ («шапка»): фон/рамка/лого фиксированы,
 * при каждом запросе вписываются только поля ФИО (+ курс/дата/номер) и QR.
 *
 * Реализация на pdf-lib: рисуем бланк программно (без внешнего Chromium),
 * встраиваем Unicode-шрифт (DejaVuSans) для корректной кириллицы.
 */

let fontRegular: Buffer | null = null;
let fontBold: Buffer | null = null;

function loadFont(file: string): Buffer {
  const p = path.join(process.cwd(), "assets", "fonts", file);
  return fs.readFileSync(p);
}

export type CertData = {
  holderFullName: string;
  courseTitle: string;
  instructorName: string;
  certNumber: string;
  issuedAt: Date;
  verifyUrl: string; // ссылка, зашитая в QR (постоянный /cert/<qrToken>)
  locale?: "uk" | "en";
};

const L = {
  uk: {
    title: "СЕРТИФІКАТ",
    subtitle: "про проходження курсу стрілецької підготовки",
    awarded: "Цей сертифікат посвідчує, що",
    completed: "успішно пройшов(ла) курс",
    instructor: "Інструктор",
    number: "№ сертифіката",
    date: "Дата видачі",
    verify: "Перевірити справжність — скануйте QR",
  },
  en: {
    title: "CERTIFICATE",
    subtitle: "of completion of a firearms training course",
    awarded: "This certificate is awarded to",
    completed: "for successfully completing the course",
    instructor: "Instructor",
    number: "Certificate No.",
    date: "Date of issue",
    verify: "Verify authenticity — scan the QR",
  },
};

export async function generateCertificatePdf(data: CertData): Promise<Uint8Array> {
  if (!fontRegular) fontRegular = loadFont("DejaVuSans.ttf");
  if (!fontBold) fontBold = loadFont("DejaVuSans-Bold.ttf");
  const t = L[data.locale ?? "uk"];

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const reg = await doc.embedFont(fontRegular, { subset: true });
  const bold = await doc.embedFont(fontBold, { subset: true });

  // A4 landscape
  const W = 842;
  const H = 595;
  const page = doc.addPage([W, H]);

  const bg = rgb(0.043, 0.059, 0.047); // #0b0f0c
  const panel = rgb(0.071, 0.102, 0.078);
  const accent = rgb(0.56, 0.75, 0.3);
  const light = rgb(0.92, 0.95, 0.92);
  const muted = rgb(0.55, 0.63, 0.57);

  // --- ШАБЛОН (шапка) — фиксированная часть ---
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: bg });
  // внешняя рамка
  page.drawRectangle({
    x: 24,
    y: 24,
    width: W - 48,
    height: H - 48,
    borderColor: accent,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: W - 68,
    height: H - 68,
    borderColor: panel,
    borderWidth: 1,
  });

  const center = (text: string, y: number, size: number, font = reg, color = light) => {
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (W - tw) / 2, y, size, font, color });
  };

  center("YASTRUB ACADEMY", H - 78, 13, bold, muted);
  center(t.title, H - 118, 44, bold, accent);
  center(t.subtitle, H - 146, 14, reg, muted);

  center(t.awarded, H - 200, 13, reg, muted);
  // ФИО — единственное реально подставляемое крупное поле
  center(data.holderFullName, H - 250, 34, bold, light);

  // подчёркивание под ФИО
  {
    const lineW = Math.min(520, Math.max(260, data.holderFullName.length * 16));
    page.drawLine({
      start: { x: (W - lineW) / 2, y: H - 262 },
      end: { x: (W + lineW) / 2, y: H - 262 },
      thickness: 1,
      color: accent,
    });
  }

  center(t.completed, H - 300, 13, reg, muted);
  center(`«${data.courseTitle}»`, H - 330, 22, bold, accent);

  // нижний блок: инструктор / номер / дата
  const dateStr = data.issuedAt.toLocaleDateString(data.locale === "en" ? "en-GB" : "uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const footY = 90;
  page.drawText(`${t.instructor}: ${data.instructorName}`, {
    x: 60,
    y: footY + 24,
    size: 12,
    font: reg,
    color: light,
  });
  page.drawText(`${t.number}: ${data.certNumber}`, {
    x: 60,
    y: footY,
    size: 12,
    font: reg,
    color: muted,
  });
  page.drawText(`${t.date}: ${dateStr}`, {
    x: 60,
    y: footY - 24,
    size: 12,
    font: reg,
    color: muted,
  });

  // --- QR (справа внизу) ---
  const qrPng = await qrPngBuffer(data.verifyUrl);
  const qrImg = await doc.embedPng(qrPng);
  const qrSize = 96;
  const qrX = W - 60 - qrSize;
  const qrY = footY - 24;
  // белая подложка под QR
  page.drawRectangle({
    x: qrX - 6,
    y: qrY - 6,
    width: qrSize + 12,
    height: qrSize + 12,
    color: rgb(1, 1, 1),
  });
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  {
    const vt = t.verify;
    const vw = reg.widthOfTextAtSize(vt, 8);
    page.drawText(vt, {
      x: qrX + qrSize / 2 - vw / 2,
      y: qrY - 16,
      size: 8,
      font: reg,
      color: muted,
    });
  }

  // водяной знак
  page.drawText("CERTIFIED", {
    x: 250,
    y: 250,
    size: 90,
    font: bold,
    color: rgb(0.1, 0.14, 0.11),
    rotate: degrees(30),
    opacity: 0.25,
  });

  return doc.save();
}

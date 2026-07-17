import QRCode from "qrcode";

/** Возвращает PNG QR-кода как Buffer (для вставки в PDF через pdf-lib). */
export async function qrPngBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0b0f0cff", light: "#ffffffff" },
  });
}

/** Возвращает QR как data-URL (для <img> на странице сертификата). */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0b0f0cff", light: "#ffffffff" },
  });
}

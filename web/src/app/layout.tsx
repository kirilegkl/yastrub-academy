import type { Metadata } from "next";
import { Unbounded, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Тренувальний Центр ЯСТРУБ — курси стрілецької підготовки",
  description:
    "Курси зі стрільби: карабін, марксман+, снайперська гвинтівка, високоточна стрільба, пістолет, CQB, захист від дронів. Сертифікат після проходження.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${display.variable} ${sans.variable}`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

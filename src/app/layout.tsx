import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale } from "@/lib/i18n/config";
import enMessages from "../../messages/en.json";
import "./globals.css";

// PRD REQ-UX-06: Sarabun for Thai (400, 600), Inter for English (400, 600)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "JANGJIN Plus",
  description:
    "Clinic management system for JangJin TCM Clinic — patients, courses, treatment logs, appointments, and invoicing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      className={`${inter.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={defaultLocale} messages={enMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

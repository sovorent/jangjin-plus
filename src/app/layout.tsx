import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
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
      lang="en"
      className={`${inter.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

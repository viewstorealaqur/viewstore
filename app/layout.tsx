import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VIEW STORE — Premium Accessories & Electronics",
  description:
    "Shop premium phone cases, GaN chargers, wireless audio, cables, and mobile accessories. Order instantly on WhatsApp.",
  keywords: "phone cases, chargers, earbuds, USB-C cables, mobile accessories, VIEW STORE",
  openGraph: {
    title: "VIEW STORE — Premium Accessories & Electronics",
    description:
      "Shop premium phone cases, GaN chargers, wireless audio, cables, and mobile accessories. Order instantly on WhatsApp.",
    type: "website",
    locale: "en_PK",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

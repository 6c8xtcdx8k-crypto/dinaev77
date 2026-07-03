import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Styleberries — обувь и одежда для женщин и мужчин",
    template: "%s — Styleberries",
  },
  description:
    "Styleberries: кроссовки, обувь и одежда бренда. Быстрая доставка, скидки и промокоды.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

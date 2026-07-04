import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TelegramInit } from "@/components/telegram/TelegramInit";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Styleberries — обувь и одежда для женщин и мужчин",
    template: "%s — Styleberries",
  },
  description:
    "Styleberries — интернет-магазин: кроссовки, обувь и одежда. Быстрая доставка, скидки и промокоды.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        <TelegramInit isAuthed={!!user} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

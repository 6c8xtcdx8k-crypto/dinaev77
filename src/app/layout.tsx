import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TelegramInit } from "@/components/telegram/TelegramInit";
import { BottomNav } from "@/components/layout/BottomNav";
import { getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { prisma } from "@/lib/db";

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
  const [cartCount, favCount] = await Promise.all([
    getCartCount(),
    user ? prisma.favorite.count({ where: { userId: user.id } }) : 0,
  ]);
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col pb-16 md:pb-0">
        <TelegramInit isAuthed={!!user} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNav cartCount={cartCount} favCount={favCount} />
      </body>
    </html>
  );
}

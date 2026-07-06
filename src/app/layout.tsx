import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TelegramInit } from "@/components/telegram/TelegramInit";
import { BottomNav } from "@/components/layout/BottomNav";
import { getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "Styleberries — одежда для женщин и мужчин",
    template: "%s — Styleberries",
  },
  description:
    "Styleberries — интернет-магазин одежды. Быстрая доставка, скидки и промокоды.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cartCount = await getCartCount();
  return (
    <html lang="ru" className={montserrat.variable}>
      <body className="flex min-h-screen flex-col pb-20 font-sans md:pb-0">
        <TelegramInit isAuthed={!!user} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNav cartCount={cartCount} />
      </body>
    </html>
  );
}

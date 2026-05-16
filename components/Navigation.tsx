"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, BookOpen, Map, ClipboardList, Trophy, User, MessageCircle, LayoutDashboard
} from "lucide-react";

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/study", label: "Учёба", icon: BookOpen },
  { href: "/quest", label: "Квесты", icon: Map },
  { href: "/tests", label: "Тесты", icon: ClipboardList },
  { href: "/leaderboard", label: "Рейтинг", icon: Trophy },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/chat", label: "Чат", icon: MessageCircle },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col gap-2 p-4 z-50"
        style={{ background: "rgba(8,11,20,0.95)", borderRight: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="mb-6 px-2 pt-2">
          <Link href="/">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                CQ
              </div>
              <div>
                <div className="font-bold text-lg neon-text-purple">Catch Quest</div>
                <div className="text-xs text-gray-500">English for Life</div>
              </div>
            </div>
          </Link>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  active ? "nav-active" : "hover:bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={18} className={active ? "text-purple-400" : ""} />
                <span className={`text-sm font-medium ${active ? "text-purple-300" : ""}`}>{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
                    style={{ boxShadow: "0 0 8px rgba(168,85,247,0.8)" }} />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* XP bar at bottom */}
        <div className="mt-auto px-2 pb-2">
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
              <span>Уровень 7</span>
              <span>2840 / 3500 XP</span>
            </div>
            <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
              <div className="xp-bar h-full rounded-full" style={{ width: "81%" }} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-orange-400 streak-fire">🔥</span>
              <span className="text-xs text-gray-400">7 дней подряд</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: "rgba(8,11,20,0.97)", borderTop: "1px solid rgba(168,85,247,0.2)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    active ? "nav-active" : "text-gray-500"
                  }`}
                >
                  <Icon size={20} className={active ? "text-purple-400" : ""} />
                  <span className={`text-[10px] font-medium ${active ? "text-purple-300" : ""}`}>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

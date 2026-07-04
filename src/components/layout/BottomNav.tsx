"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Нижняя навигация в стиле маркетплейсов (мобильные и Telegram Mini App).
 * На десктопе скрыта — там работает шапка.
 */
export function BottomNav({ cartCount, favCount }: { cartCount: number; favCount: number }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Главная", icon: HomeIcon, active: pathname === "/" },
    { href: "/catalog", label: "Каталог", icon: GridIcon, active: pathname.startsWith("/catalog") || pathname.startsWith("/product") },
    { href: "/cart", label: "Корзина", icon: CartIcon, active: pathname.startsWith("/cart") || pathname.startsWith("/checkout"), badge: cartCount },
    { href: "/favorites", label: "Избранное", icon: HeartIcon, active: pathname.startsWith("/favorites"), badge: favCount },
    { href: "/account", label: "Профиль", icon: UserIcon, active: pathname.startsWith("/account") || pathname.startsWith("/login") || pathname.startsWith("/register") },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Основная навигация"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium transition-colors duration-300 ${
              item.active ? "text-brand-600" : "text-zinc-500"
            }`}
          >
            {/* активная «пилюля» позади иконки */}
            <span
              className={`absolute top-1 h-7 w-12 rounded-full bg-brand-50 transition-all duration-300 ${
                item.active ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
              aria-hidden
            />
            <span className={`relative transition-transform duration-300 ${item.active ? "scale-110 animate-pop" : ""}`}>
              <item.icon filled={item.active} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 animate-scale-in items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 px-1 text-[9.5px] font-bold text-white shadow-glow">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            <span className="relative">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

type IconProps = { filled?: boolean };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function HomeIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} fill={filled ? "currentColor" : "none"}>
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V14H9V21H4C3.45 21 3 20.55 3 20V10.5Z" />
    </svg>
  );
}
function GridIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} fill={filled ? "currentColor" : "none"}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function CartIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <path d="M3 4H5L7 15H19L21 7H6" fill={filled ? "currentColor" : "none"} />
      <circle cx="8.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function HeartIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} fill={filled ? "currentColor" : "none"}>
      <path d="M12 21C12 21 3 14.5 3 8.5C3 5.5 5.5 3 8.5 3C10 3 11.3 3.7 12 4.8C12.7 3.7 14 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14.5 12 21 12 21Z" />
    </svg>
  );
}
function UserIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} fill={filled ? "currentColor" : "none"}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21C4 17 7.5 14.5 12 14.5C16.5 14.5 20 17 20 21" />
    </svg>
  );
}

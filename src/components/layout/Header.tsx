import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { SearchBar } from "./SearchBar";

const NAV = [
  { href: "/catalog?category=clothing", label: "Одежда" },
  { href: "/catalog?category=bags", label: "Сумки" },
  { href: "/catalog?gender=WOMEN", label: "Женская" },
  { href: "/catalog?gender=MEN", label: "Мужская" },
  { href: "/catalog?sort=new", label: "Новинки", accent: true },
];

export async function Header() {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartCount()]);
  const favCount = user
    ? await prisma.favorite.count({ where: { userId: user.id } })
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/55 shadow-[0_1px_20px_rgba(31,92,141,.08)] backdrop-blur-2xl backdrop-saturate-150">
      <div className="container flex h-16 items-center gap-4">
        {/* Логотип в духе meprod: цветные слэши + жирный курсив */}
        <Link href="/" className="group flex shrink-0 items-baseline gap-0.5 text-xl font-black italic tracking-tight">
          <span className="flex -skew-x-12 gap-[3px] pr-1.5" aria-hidden>
            <span className="h-5 w-1.5 rounded-sm bg-sky-500 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="h-5 w-1.5 rounded-sm bg-brand-300 transition-transform duration-300 delay-75 group-hover:-translate-y-0.5" />
            <span className="h-5 w-1.5 rounded-sm bg-sky-300 transition-transform duration-300 delay-150 group-hover:-translate-y-0.5" />
          </span>
          <span className="uppercase text-brand-400">Styleberries</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <HeaderIcon href="/favorites" label="Избранное" count={favCount}>
            <HeartIcon />
          </HeaderIcon>
          <HeaderIcon href="/cart" label="Корзина" count={cartCount}>
            <CartIcon />
          </HeaderIcon>
          <HeaderIcon href={user ? "/account" : "/login"} label={user ? user.name.split(" ")[0] : "Войти"}>
            <UserIcon />
          </HeaderIcon>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="ml-1 hidden rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white sm:block"
            >
              Админка
            </Link>
          )}
        </nav>
      </div>

      <div className="container pb-3 md:hidden">
        <SearchBar />
      </div>

      <div className="border-t border-white/50 bg-white/40 backdrop-blur-xl">
        <div className="container flex gap-5 overflow-x-auto py-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`navlink ${item.accent ? "font-bold text-brand-600" : "text-zinc-600 hover:text-brand-600"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function HeaderIcon({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-zinc-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-600"
    >
      <span className="transition-transform duration-300 group-hover:scale-110">{children}</span>
      <span className="hidden text-[11px] leading-none sm:block">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 right-0 flex h-4 min-w-4 animate-scale-in items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-1 text-[10px] font-bold text-white shadow-glow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21C12 21 3 14.5 3 8.5C3 5.5 5.5 3 8.5 3C10 3 11.3 3.7 12 4.8C12.7 3.7 14 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14.5 12 21 12 21Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4H5L7 15H19L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="19.5" r="1.5" />
      <circle cx="17.5" cy="19.5" r="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21C4 17 7.5 14.5 12 14.5C16.5 14.5 20 17 20 21" strokeLinecap="round" />
    </svg>
  );
}

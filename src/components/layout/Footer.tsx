import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-extrabold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-lg" />
            <span>
              Style<span className="text-brand-600">berries</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Интернет-магазин: кроссовки, обувь и одежда для женщин и мужчин.
          </p>
        </div>
        <FooterCol
          title="Каталог"
          links={[
            ["Женщинам", "/catalog?gender=WOMEN"],
            ["Мужчинам", "/catalog?gender=MEN"],
            ["Кроссовки", "/catalog?category=sneakers"],
            ["Скидки", "/catalog?sale=1"],
          ]}
        />
        <FooterCol
          title="Покупателям"
          links={[
            ["Корзина", "/cart"],
            ["Избранное", "/favorites"],
            ["Личный кабинет", "/account"],
          ]}
        />
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Доставка и оплата</h3>
          <p className="text-sm text-zinc-500">
            Курьером до двери или в пункт выдачи. Бесплатная курьерская доставка от 5 000 ₽.
          </p>
        </div>
      </div>
      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Styleberries. Демонстрационная платформа.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-zinc-600 transition hover:text-brand-600">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-transparent bg-white [border-image:linear-gradient(90deg,transparent,#10b981,transparent)_1]">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-baseline gap-0.5 text-lg font-black italic tracking-tight">
            <span className="flex -skew-x-12 gap-[3px] pr-1.5" aria-hidden>
              <span className="h-4 w-1 rounded-sm bg-sky-500" />
              <span className="h-4 w-1 rounded-sm bg-brand-300" />
              <span className="h-4 w-1 rounded-sm bg-sky-300" />
            </span>
            <span className="uppercase text-brand-400">Styleberries</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Интернет-магазин одежды и сумок для женщин и мужчин.
          </p>
        </div>
        <FooterCol
          title="Каталог"
          links={[
            ["Одежда", "/catalog?category=clothing"],
            ["Сумки", "/catalog?category=bags"],
            ["Женщинам", "/catalog?gender=WOMEN"],
            ["Новинки", "/catalog?sort=new"],
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
            Доставка по всей России через СДЭК — до ближайшего пункта выдачи.
          </p>
        </div>
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

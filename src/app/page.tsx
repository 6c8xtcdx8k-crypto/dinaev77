import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

const TILES = [
  { href: "/catalog?gender=WOMEN", title: "Женщинам" },
  { href: "/catalog?gender=MEN", title: "Мужчинам" },
  { href: "/catalog?category=sneakers", title: "Кроссовки" },
  { href: "/catalog?category=shoes", title: "Обувь" },
];

const MARQUEE = [
  "Бесплатная доставка от 5 000 ₽",
  "Возврат 14 дней без вопросов",
  "Промокод BERRY10 — скидка 10%",
  "Новая коллекция уже в каталоге",
  "Скидки до 30%",
];

export default async function HomePage() {
  const [newArrivals, saleItems, popular] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { images: { orderBy: { sort: "asc" }, take: 1 } },
    }),
    prisma.product.findMany({
      where: { isActive: true, discountPercent: { gt: 0 } },
      orderBy: { discountPercent: "desc" },
      take: 4,
      include: { images: { orderBy: { sort: "asc" }, take: 1 } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { salesCount: "desc" },
      take: 4,
      include: { images: { orderBy: { sort: "asc" }, take: 1 } },
    }),
  ]);

  return (
    <div className="container space-y-14 py-8">
      {/* Hero: живой градиент + парящие карточки */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-600 to-emerald-400 bg-[length:200%_200%] px-8 py-16 text-white animate-gradient-x sm:px-14">
        {/* декоративные блобы */}
        <span className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-float-slow" aria-hidden />
        <span className="pointer-events-none absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl animate-float" aria-hidden />
        <span
          className="pointer-events-none absolute right-6 top-8 hidden rotate-12 select-none rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md animate-float sm:block"
          aria-hidden
        >
          −30% на хиты
        </span>
        <span
          className="pointer-events-none absolute bottom-10 right-24 hidden -rotate-6 select-none rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md animate-float-slow lg:block"
          aria-hidden
        >
          2 500+ довольных покупателей
        </span>

        <p className="animate-fade-up text-sm font-semibold uppercase tracking-[.25em] text-brand-100">
          Новая коллекция
        </p>
        <h1
          className="mt-3 max-w-2xl animate-fade-up text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl"
          style={{ animationDelay: ".12s" }}
        >
          Всё для вашего{" "}
          <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
            стиля
          </span>{" "}
          — в одном месте
        </h1>
        <p className="mt-5 max-w-md animate-fade-up text-lg text-brand-50/90" style={{ animationDelay: ".24s" }}>
          Кроссовки, обувь и одежда для женщин и мужчин. Скидки до 30% и промокод{" "}
          <span className="rounded-lg bg-white/20 px-2 py-0.5 font-mono font-bold backdrop-blur">BERRY10</span>{" "}
          на первый заказ.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: ".36s" }}>
          <Link
            href="/catalog"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-brand-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
          >
            Смотреть каталог
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/catalog?sale=1"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/10 active:scale-95"
          >
            Товары со скидкой
          </Link>
        </div>
      </section>

      {/* Бегущая строка */}
      <div className="relative -mt-6 overflow-hidden rounded-2xl border border-brand-100 bg-white/70 py-3 shadow-card backdrop-blur">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap pl-10 text-sm font-semibold text-zinc-600">
          {[...MARQUEE, ...MARQUEE].map((text, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-brand-500 to-emerald-400" aria-hidden />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Категории */}
      <Reveal variant="stagger" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="card card-lift shine group flex items-center justify-between gap-3 border-l-4 border-l-brand-500 p-5"
          >
            <span className="font-bold">{tile.title}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-glow" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </Reveal>

      <ProductRow title="Хиты продаж" href="/catalog" products={popular} />
      <ProductRow title="Скидки" href="/catalog?sale=1" products={saleItems} accent />
      <ProductRow title="Новинки" href="/catalog?sort=new" products={newArrivals} />
    </div>
  );
}

function ProductRow({
  title,
  href,
  products,
  accent = false,
}: {
  title: string;
  href: string;
  products: React.ComponentProps<typeof ProductCard>["product"][];
  accent?: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <Reveal className="mb-5 flex items-baseline justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
          {accent && (
            <span className="ml-3 inline-block -rotate-2 rounded-lg bg-gradient-to-r from-accent-500 to-orange-500 px-2.5 py-0.5 align-middle text-sm font-extrabold text-white shadow-glow">
              HOT
            </span>
          )}
        </h2>
        <Link href={href} className="navlink text-sm text-brand-600">
          Все товары →
        </Link>
      </Reveal>
      <Reveal variant="stagger" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </Reveal>
    </section>
  );
}

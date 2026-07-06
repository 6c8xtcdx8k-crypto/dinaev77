import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

const TILES = [
  { href: "/catalog?gender=WOMEN", title: "Женщинам" },
  { href: "/catalog?gender=MEN", title: "Мужчинам" },
  { href: "/catalog?sort=new", title: "Новинки" },
  { href: "/catalog?sale=1", title: "Скидки" },
];

const MARQUEE = [
  "Бесплатная доставка от 5 000 ₽",
  "Доставка курьером и в пункты выдачи",
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
      {/* Hero: пастельное «облако» в духе meprod */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-300 via-sky-200 to-sky-300 bg-[length:200%_200%] px-8 py-16 animate-gradient-x sm:px-14">
        {/* декоративные блобы */}
        <span className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/50 blur-2xl animate-float-slow" aria-hidden />
        <span className="pointer-events-none absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-brand-200/60 blur-3xl animate-float" aria-hidden />
        <span
          className="pointer-events-none absolute right-8 top-10 hidden rotate-12 select-none rounded-full bg-white/60 px-5 py-3 text-sm font-extrabold text-sky-700 shadow-card backdrop-blur-md animate-float sm:block"
          aria-hidden
        >
          −30% на хиты
        </span>
        <span
          className="pointer-events-none absolute bottom-12 right-24 hidden -rotate-6 select-none rounded-full bg-white/60 px-5 py-3 text-sm font-extrabold text-brand-700 shadow-card backdrop-blur-md animate-float-slow lg:block"
          aria-hidden
        >
          2 500+ довольных покупателей
        </span>

        <span className="sticker animate-fade-up">новая коллекция</span>
        <h1
          className="mt-4 max-w-3xl animate-fade-up text-4xl font-black uppercase leading-[1.04] tracking-tight text-white [text-shadow:0_2px_24px_rgba(43,140,214,.25)] sm:text-6xl"
          style={{ animationDelay: ".12s" }}
        >
          Всё для вашего <span className="text-brand-300">стиля</span> в одном месте
        </h1>
        <p
          className="mt-5 max-w-md animate-fade-up text-lg font-medium text-[#2c2c2c]"
          style={{ animationDelay: ".24s" }}
        >
          Одежда для женщин и мужчин: худи, платья, джинсы и не только. Скидки до 30% и промокод{" "}
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 font-mono font-bold text-brand-700">BERRY10</span>{" "}
          на первый заказ.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: ".36s" }}>
          <Link href="/catalog" className="btn-primary group !px-8 !py-3.5 text-base">
            Смотреть каталог
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/catalog?sale=1"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-sky-700 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover active:scale-95"
          >
            Товары со скидкой
          </Link>
        </div>
      </section>

      {/* Бегущая строка */}
      <div className="relative -mt-6 overflow-hidden rounded-full border border-sky-200 bg-white/80 py-3 shadow-card backdrop-blur">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap pl-10 text-sm font-bold text-[#2c2c2c]">
          {[...MARQUEE, ...MARQUEE].map((text, i) => (
            <span key={i} className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${i % 2 ? "bg-brand-300" : "bg-sky-500"}`}
                aria-hidden
              />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Категории — пастельные облака */}
      <Reveal variant="stagger" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((tile, i) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`card-lift shine group flex items-center justify-between gap-3 rounded-3xl p-6 shadow-card ${
              i % 2 ? "bg-brand-100" : "bg-sky-200"
            }`}
          >
            <span className="text-lg font-extrabold text-[#2c2c2c]">{tile.title}</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold shadow-card transition-all duration-300 group-hover:scale-110 ${
                i % 2 ? "text-brand-600 group-hover:bg-brand-400 group-hover:text-white" : "text-sky-600 group-hover:bg-sky-500 group-hover:text-white"
              }`}
              aria-hidden
            >
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
            <span className="ml-3 inline-block -rotate-2 rounded-lg bg-gradient-to-r from-brand-400 to-brand-500 px-2.5 py-0.5 align-middle text-sm font-extrabold text-white shadow-glow">
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

import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

const TILES = [
  { href: "/catalog?gender=WOMEN", title: "Женщинам", emoji: "👗" },
  { href: "/catalog?gender=MEN", title: "Мужчинам", emoji: "🧥" },
  { href: "/catalog?category=sneakers", title: "Кроссовки", emoji: "👟" },
  { href: "/catalog?category=shoes", title: "Обувь", emoji: "👞" },
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
    <div className="container space-y-12 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 px-8 py-14 text-white sm:px-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
          Новая коллекция
        </p>
        <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">
          Стиль, который собирается как ягоды — по одной
        </h1>
        <p className="mt-4 max-w-md text-brand-50">
          Кроссовки, обувь и одежда Styleberries. Скидки до 30% и промокод{" "}
          <span className="rounded bg-white/20 px-2 py-0.5 font-mono font-bold">BERRY10</span> на
          первый заказ.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/catalog" className="btn-primary !bg-white !text-brand-700 hover:!bg-brand-50">
            Смотреть каталог
          </Link>
          <Link href="/catalog?sale=1" className="btn-secondary !border-white/40 !bg-transparent !text-white hover:!border-white">
            Товары со скидкой
          </Link>
        </div>
        <span className="pointer-events-none absolute -right-6 -top-6 text-[9rem] opacity-20" aria-hidden>
          🍓
        </span>
      </section>

      {/* Категории */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="card flex items-center gap-3 p-5 transition hover:border-brand-400 hover:shadow-md"
          >
            <span className="text-3xl" aria-hidden>
              {tile.emoji}
            </span>
            <span className="font-semibold">{tile.title}</span>
          </Link>
        ))}
      </section>

      <ProductRow title="Хиты продаж" href="/catalog" products={popular} />
      <ProductRow title="Скидки" href="/catalog?sale=1" products={saleItems} />
      <ProductRow title="Новинки" href="/catalog?sort=new" products={newArrivals} />
    </div>
  );
}

function ProductRow({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: React.ComponentProps<typeof ProductCard>["product"][];
}) {
  if (products.length === 0) return null;
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline">
          Все товары →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

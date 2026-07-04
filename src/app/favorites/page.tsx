import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { IconHeart } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Избранное" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: { images: { orderBy: { sort: "asc" }, take: 1 } } },
    },
  });

  const products = favorites.map((f) => f.product).filter((p) => p.isActive);

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">
        Избранное <span className="text-base font-normal text-zinc-400">{products.length}</span>
      </h1>

      {products.length === 0 ? (
        <div className="py-12 text-center">
          <IconHeart />
          <p className="mt-4 font-semibold">В избранном пока пусто</p>
          <p className="mt-1 text-sm text-zinc-500">
            Нажимайте на сердечко на карточке товара, чтобы сохранить его здесь.
          </p>
          <Link href="/catalog" className="btn-primary mt-6">
            В каталог
          </Link>
        </div>
      ) : (
        <Reveal variant="stagger" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Reveal>
      )}
    </div>
  );
}

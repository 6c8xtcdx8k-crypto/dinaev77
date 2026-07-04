import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Просмотренные товары" };
export const dynamic = "force-dynamic";

export default async function ViewedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const viewed = await prisma.viewedProduct.findMany({
    where: { userId: user.id, product: { isActive: true } },
    orderBy: { viewedAt: "desc" },
    take: 48,
    include: {
      product: { include: { images: { orderBy: { sort: "asc" }, take: 1 } } },
    },
  });

  return (
    <div className="container py-6">
      <Link href="/account" className="text-sm text-zinc-400 hover:text-brand-600">
        ← Профиль
      </Link>
      <h1 className="mb-5 mt-1 text-2xl font-bold">
        Просмотренные <span className="text-base font-normal text-zinc-400">{viewed.length}</span>
      </h1>

      {viewed.length === 0 ? (
        <div className="card p-8 text-center text-sm text-zinc-500">
          <p className="font-semibold text-zinc-700">Вы ещё ничего не смотрели</p>
          <p className="mt-1">Товары, которые вы открывали, будут собираться здесь.</p>
          <Link href="/catalog" className="mt-3 inline-block font-medium text-brand-600 hover:underline">
            В каталог →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {viewed.map((v) => (
            <ProductCard key={v.productId} product={v.product} />
          ))}
        </div>
      )}
    </div>
  );
}

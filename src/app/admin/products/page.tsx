import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: "Товары — админка" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      variants: { select: { stock: true } },
      images: { orderBy: { sort: "asc" }, take: 1 },
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Товары ({products.length})</h2>
        <Link href="/admin/products/new" className="btn-primary !py-2 text-sm">
          + Добавить товар
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="p-3">Товар</th>
              <th className="p-3">Категория</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Скидка</th>
              <th className="p-3">Остаток</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="transition hover:bg-zinc-50">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:text-brand-600">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt="" className="h-10 w-8 rounded object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/logo.png" alt="" className="h-8 w-8 rounded opacity-40" />
                      )}
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3 text-zinc-500">{p.category.name}</td>
                  <td className="p-3">{formatPrice(p.basePrice)}</td>
                  <td className="p-3">{p.discountPercent > 0 ? `−${p.discountPercent}%` : "—"}</td>
                  <td className={`p-3 font-medium ${stock === 0 ? "text-red-600" : stock <= 5 ? "text-amber-600" : ""}`}>
                    {stock} шт.
                  </td>
                  <td className="p-3">
                    <span className={`badge ${p.isActive ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-500"}`}>
                      {p.isActive ? "Активен" : "Скрыт"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

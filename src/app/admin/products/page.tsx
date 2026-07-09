import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { QuickPrice, ActiveToggle } from "@/components/admin/QuickEdit";

export const metadata: Metadata = { title: "Товары — админка" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; status?: string }>;
}) {
  const { q, cat, status } = await searchParams;
  const query = q?.trim();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(query ? { OR: [{ name: { contains: query } }, { slug: { contains: query } }] } : {}),
        ...(cat ? { category: { slug: cat } } : {}),
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "hidden" ? { isActive: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: { select: { stock: true } },
        images: { orderBy: { sort: "asc" }, take: 1 },
      },
    }),
    prisma.category.findMany({ orderBy: { sort: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Товары ({products.length})</h2>
        <Link href="/admin/products/new" className="btn-primary !py-2 text-sm">
          + Добавить товар
        </Link>
      </div>

      {/* Поиск и фильтры */}
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/products">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Поиск по названию…"
          className="input max-w-xs !py-2 text-sm"
        />
        <select name="cat" defaultValue={cat ?? ""} className="input w-auto !py-2 text-sm">
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="input w-auto !py-2 text-sm">
          <option value="">Все статусы</option>
          <option value="active">На сайте</option>
          <option value="hidden">Скрытые</option>
        </select>
        <button type="submit" className="btn-secondary !py-2 text-sm">Найти</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="p-3">Товар</th>
              <th className="p-3">Категория</th>
              <th className="p-3">Цена (быстрое ред.)</th>
              <th className="p-3">Остаток</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-400">
                  Ничего не найдено
                </td>
              </tr>
            )}
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="transition hover:bg-sky-50/40">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:text-brand-600">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt="" className="h-12 w-9 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-12 w-9 items-center justify-center rounded-lg bg-sky-100 text-[10px] font-bold text-sky-500">
                          нет фото
                        </span>
                      )}
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3 text-zinc-500">{p.category.name}</td>
                  <td className="p-3">
                    <QuickPrice productId={p.id} priceRub={p.basePrice / 100} />
                  </td>
                  <td className={`p-3 font-medium ${stock === 0 ? "text-red-600" : stock <= 5 ? "text-brand-600" : ""}`}>
                    {stock} шт.
                  </td>
                  <td className="p-3">
                    <ActiveToggle productId={p.id} isActive={p.isActive} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Цена меняется прямо в таблице (Enter — сохранить). Статус переключается кликом.
        Фото, размеры и остатки — внутри карточки товара.
      </p>
    </div>
  );
}

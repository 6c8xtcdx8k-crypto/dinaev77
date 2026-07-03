import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Новый товар — админка" };
export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sort: "asc" } });

  return (
    <div className="max-w-3xl">
      <h2 className="mb-4 text-lg font-bold">Новый товар</h2>
      <ProductForm categories={categories} />
      <p className="mt-3 text-sm text-zinc-400">
        Изображения и варианты (размеры, цвета, остатки) можно будет добавить после создания.
      </p>
    </div>
  );
}

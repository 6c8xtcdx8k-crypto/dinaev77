import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantManager } from "@/components/admin/VariantManager";
import { ImageManager } from "@/components/admin/ImageManager";
import { InstagramPublish } from "@/components/admin/InstagramPublish";
import { DangerZone } from "@/components/admin/DangerZone";
import { isInstagramConfigured } from "@/lib/instagram";

export const metadata: Metadata = { title: "Товар — админка" };
export const dynamic = "force-dynamic";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
        images: { orderBy: { sort: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { sort: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{product.name}</h2>
        <Link href={`/product/${product.slug}`} className="text-sm font-medium text-brand-600 hover:underline">
          Открыть на сайте →
        </Link>
      </div>

      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          gender: product.gender,
          priceRub: product.basePrice / 100,
          isActive: product.isActive,
        }}
      />

      <ImageManager productId={product.id} images={product.images} />
      <VariantManager productId={product.id} variants={product.variants} />
      {(await isInstagramConfigured()) && <InstagramPublish productId={product.id} />}
      <DangerZone productId={product.id} productName={product.name} isActive={product.isActive} />
    </div>
  );
}

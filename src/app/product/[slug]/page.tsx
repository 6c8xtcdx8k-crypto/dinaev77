import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug, getSimilarProducts } from "@/services/catalog";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { GENDER_LABELS, type Gender } from "@/lib/constants";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantPicker } from "@/components/product/VariantPicker";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { RatingStars } from "@/components/product/RatingStars";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Товар не найден" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const user = await getCurrentUser();

  // История просмотров для раздела «Просмотренные» в кабинете.
  if (user) {
    await prisma.viewedProduct.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      update: { viewedAt: new Date() },
      create: { userId: user.id, productId: product.id },
    });
  }

  const [favorited, similar] = await Promise.all([
    user
      ? prisma.favorite
          .findUnique({
            where: { userId_productId: { userId: user.id, productId: product.id } },
          })
          .then(Boolean)
      : false,
    getSimilarProducts(product.id, product.categoryId),
  ]);

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="container py-6">
      <nav className="mb-4 text-sm text-zinc-400" aria-label="Хлебные крошки">
        <Link href="/" className="hover:text-brand-600">Главная</Link>
        {" / "}
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-zinc-600">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,480px)_1fr]">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <p className="text-sm font-medium text-brand-600">
            {product.category.name} · {GENDER_LABELS[product.gender as Gender] ?? product.gender}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <div className="mt-2">
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} />
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatPrice(product.basePrice)}</span>
            {product.oldPrice && product.oldPrice > product.basePrice && (
              <>
                <span className="text-lg text-zinc-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="badge bg-brand-400 text-white">−{product.discountPercent}%</span>
              </>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3">
            <div className="flex-1">
              {totalStock > 0 ? (
                <VariantPicker
                  variants={product.variants.map((v) => ({
                    id: v.id,
                    size: v.size,
                    color: v.color,
                    colorHex: v.colorHex,
                    stock: v.stock,
                  }))}
                />
              ) : (
                <p className="rounded-xl bg-zinc-100 p-4 text-sm font-medium text-zinc-500">
                  Товара временно нет в наличии
                </p>
              )}
            </div>
            <FavoriteButton productId={product.id} initialFavorited={favorited} />
          </div>

          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold">Описание</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">
              {product.description}
            </p>
          </section>
        </div>
      </div>

      {/* Отзывы */}
      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-bold">
            Отзывы <span className="text-zinc-400">({product.reviews.length})</span>
          </h2>
          {product.reviews.length === 0 ? (
            <p className="text-sm text-zinc-500">Отзывов пока нет — станьте первым!</p>
          ) : (
            <ul className="space-y-4">
              {product.reviews.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.user.name}</span>
                    <span className="text-xs text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  <div className="mt-1">
                    <RatingStars rating={r.rating} size="sm" />
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold">Оставить отзыв</h2>
          <div className="card p-5">
            <ReviewForm productId={product.id} isAuthed={!!user} />
          </div>
        </div>
      </section>

      {/* Похожие товары */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Похожие товары</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

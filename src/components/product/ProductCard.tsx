import Link from "next/link";
import { discountedPrice, formatPrice } from "@/lib/money";
import { RatingStars } from "./RatingStars";

export type ProductCardData = {
  slug: string;
  name: string;
  basePrice: number;
  discountPercent: number;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; alt?: string }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const finalPrice = discountedPrice(product.basePrice, product.discountPercent);
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt || product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-14 rounded-xl opacity-30" />
          </div>
        )}
        {product.discountPercent > 0 && (
          <span className="badge absolute left-2 top-2 bg-accent-500 text-white">
            −{product.discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-zinc-900">{formatPrice(finalPrice)}</span>
          {product.discountPercent > 0 && (
            <span className="text-sm text-zinc-400 line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>
        <span className="line-clamp-2 text-sm text-zinc-600">{product.name}</span>
        <div className="mt-auto pt-1">
          <RatingStars rating={product.ratingAvg} count={product.ratingCount} size="sm" />
        </div>
      </div>
    </Link>
  );
}

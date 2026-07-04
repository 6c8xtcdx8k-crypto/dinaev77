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
      className="card card-lift shine group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt || product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-1"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-14 rounded-xl opacity-30" />
          </div>
        )}
        {product.discountPercent > 0 && (
          <span className="badge absolute left-2 top-2 bg-gradient-to-r from-accent-500 to-orange-500 text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
            −{product.discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-zinc-900 transition-colors duration-300 group-hover:text-brand-700">
            {formatPrice(finalPrice)}
          </span>
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

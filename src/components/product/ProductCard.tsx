import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { RatingStars } from "./RatingStars";

export type ProductCardData = {
  slug: string;
  name: string;
  basePrice: number;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; alt?: string }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
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
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-zinc-900 transition-colors duration-300 group-hover:text-brand-700">
            {formatPrice(product.basePrice)}
          </span>
        </div>
        <span className="line-clamp-2 text-sm text-zinc-600">{product.name}</span>
        <div className="mt-auto pt-1">
          <RatingStars rating={product.ratingAvg} count={product.ratingCount} size="sm" />
        </div>
      </div>
    </Link>
  );
}

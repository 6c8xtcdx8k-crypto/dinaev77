"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";

/**
 * Бесконечная лента каталога: следующая страница подгружается сама,
 * когда покупатель докручивает до конца — без кнопок и номеров страниц.
 */
export function InfiniteProducts({
  initial,
  totalPages,
  query,
}: {
  initial: ProductCardData[];
  totalPages: number;
  query: string; // строка фильтров без page
}) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const done = page >= totalPages;

  useEffect(() => {
    if (done) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || loading) return;
        setLoading(true);
        fetch(`/api/catalog?${query ? `${query}&` : ""}page=${page + 1}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then((d: { page: number; items: ProductCardData[] }) => {
            setItems((prev) => {
              const seen = new Set(prev.map((p) => p.slug));
              return [...prev, ...d.items.filter((p) => !seen.has(p.slug))];
            });
            setPage(d.page);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, loading, done, query]);

  return (
    <>
      <div className="stagger grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
      {!done && (
        <div ref={sentinelRef} className="flex justify-center py-8" aria-hidden>
          <span
            className={`h-7 w-7 rounded-full border-2 border-brand-300 border-t-brand-600 ${
              loading ? "animate-spin" : "opacity-0"
            }`}
          />
        </div>
      )}
    </>
  );
}

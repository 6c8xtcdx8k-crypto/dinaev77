"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Facets = {
  sizes: string[];
  colors: { name: string; hex: string }[];
  priceMin: number; // копейки
  priceMax: number;
};

function FilterSidebarInner({ facets }: { facets: Facets }) {
  const router = useRouter();
  const params = useSearchParams();

  const selectedSizes = params.getAll("size");
  const selectedColors = params.getAll("color");
  const inStock = params.get("inStock") === "1";
  const [priceFrom, setPriceFrom] = useState(params.get("priceMin") ?? "");
  const [priceTo, setPriceTo] = useState(params.get("priceMax") ?? "");

  function update(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page"); // смена фильтра сбрасывает пагинацию
    router.push(`/catalog?${next.toString()}`);
  }

  function toggleMulti(key: "size" | "color", value: string) {
    update((p) => {
      const current = p.getAll(key);
      p.delete(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      next.forEach((v) => p.append(key, v));
    });
  }

  const hasFilters =
    selectedSizes.length > 0 || selectedColors.length > 0 || inStock ||
    params.get("priceMin") || params.get("priceMax");

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          type="button"
          className="text-sm font-medium text-brand-600 hover:underline"
          onClick={() =>
            update((p) => {
              ["size", "color", "inStock", "priceMin", "priceMax"].forEach((k) => p.delete(k));
              setPriceFrom("");
              setPriceTo("");
            })
          }
        >
          Сбросить фильтры
        </button>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Цена, ₽</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(Math.floor(facets.priceMin / 100))}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="input !px-3 !py-2 text-sm"
            aria-label="Цена от"
          />
          <span className="text-zinc-400">—</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(Math.ceil(facets.priceMax / 100))}
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="input !px-3 !py-2 text-sm"
            aria-label="Цена до"
          />
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg border border-zinc-300 py-1.5 text-sm font-medium transition hover:border-brand-500 hover:text-brand-600"
          onClick={() =>
            update((p) => {
              priceFrom ? p.set("priceMin", priceFrom) : p.delete("priceMin");
              priceTo ? p.set("priceMax", priceTo) : p.delete("priceMax");
            })
          }
        >
          Применить
        </button>
      </fieldset>

      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Размер</legend>
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleMulti("size", size)}
                  className={`min-w-10 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-400"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Цвет</legend>
          <div className="space-y-1.5">
            {facets.colors.map((color) => {
              const active = selectedColors.includes(color.name);
              return (
                <label key={color.name} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleMulti("color", color.name)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span
                    className="h-4 w-4 rounded-full border border-zinc-300"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden
                  />
                  {color.name}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={inStock}
          onChange={() => update((p) => (inStock ? p.delete("inStock") : p.set("inStock", "1")))}
          className="h-4 w-4 accent-brand-600"
        />
        Только в наличии
      </label>
    </div>
  );
}

export function FilterSidebar({ facets }: { facets: Facets }) {
  return (
    <Suspense fallback={null}>
      <FilterSidebarInner facets={facets} />
    </Suspense>
  );
}

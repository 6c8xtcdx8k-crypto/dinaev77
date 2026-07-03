import type { Metadata } from "next";
import { queryCatalog, getFilterFacets } from "@/services/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";
import { IconSearch } from "@/components/ui/icons";
import { GENDER_LABELS, type Gender, type SortValue } from "@/lib/constants";

export const metadata: Metadata = { title: "Каталог" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function asString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const category = asString(sp.category);
  const gender = asString(sp.gender);
  const q = asString(sp.q);
  const priceMin = asString(sp.priceMin);
  const priceMax = asString(sp.priceMax);

  const filters = {
    category,
    gender,
    q,
    sizes: asArray(sp.size),
    colors: asArray(sp.color),
    priceMin: priceMin ? Math.round(Number(priceMin) * 100) : undefined,
    priceMax: priceMax ? Math.round(Number(priceMax) * 100) : undefined,
    inStock: asString(sp.inStock) === "1",
    sale: asString(sp.sale) === "1",
    sort: (asString(sp.sort) as SortValue) ?? "popular",
    page: Number(asString(sp.page)) || 1,
  };

  const [result, facets] = await Promise.all([
    queryCatalog(filters),
    getFilterFacets({ category, gender }),
  ]);

  const titleParts: string[] = [];
  if (gender && gender in GENDER_LABELS) titleParts.push(GENDER_LABELS[gender as Gender]);
  if (q) titleParts.push(`«${q}»`);
  const title = titleParts.length > 0 ? titleParts.join(" · ") : "Каталог";

  function makeHref(page: number): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === "page" || value === undefined) continue;
      asArray(value).forEach((v) => next.append(key, v));
    }
    if (page > 1) next.set("page", String(page));
    return `/catalog?${next.toString()}`;
  }

  return (
    <div className="container py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {title} <span className="text-base font-normal text-zinc-400">{result.total} товаров</span>
        </h1>
        <SortSelect />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit p-5 lg:sticky lg:top-36">
          <FilterSidebar facets={facets} />
        </aside>

        <div>
          {result.items.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-12 text-center">
              <IconSearch size={48} />
              <p className="font-semibold">Ничего не нашлось</p>
              <p className="text-sm text-zinc-500">
                Попробуйте изменить запрос или сбросить фильтры.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

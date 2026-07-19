import type { Metadata } from "next";
import Link from "next/link";
import { queryCatalog, getFilterFacets } from "@/services/catalog";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { InfiniteProducts } from "@/components/catalog/InfiniteProducts";
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
    sort: (asString(sp.sort) as SortValue) ?? "new",
    page: 1, // дальше страницы подгружаются лентой при прокрутке
  };

  const [result, facets] = await Promise.all([
    queryCatalog(filters),
    getFilterFacets({ category, gender }),
  ]);

  const titleParts: string[] = [];
  if (category === "clothing") {
    titleParts.push(
      gender === "WOMEN" ? "Одежда женская" : gender === "MEN" ? "Одежда мужская" : "Одежда",
    );
  } else {
    if (category === "bags") titleParts.push("Сумки");
    if (category === "bags-lux") titleParts.push("Сумки люкс");
    if (gender && gender in GENDER_LABELS) titleParts.push(GENDER_LABELS[gender as Gender]);
  }
  if (q) titleParts.push(`«${q}»`);
  const title = titleParts.length > 0 ? titleParts.join(" · ") : "Каталог";

  // Внутри раздела сумок — два вида: люксовые и другие
  const isBags = category === "bags" || category === "bags-lux";
  const BAG_KINDS = [
    { slug: "bags-lux", label: "Люксовые" },
    { slug: "bags", label: "Другие" },
  ];
  // Внутри раздела одежды — женская и мужская
  const isClothing = category === "clothing";
  const CLOTHING_KINDS = [
    { gender: "WOMEN", label: "Женская" },
    { gender: "MEN", label: "Мужская" },
  ];

  // Строка текущих фильтров — по ней лента запрашивает следующие страницы.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page" || value === undefined) continue;
    asArray(value).forEach((v) => query.append(key, v));
  }
  const queryString = query.toString();

  return (
    <div className="container py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {title} <span className="text-base font-normal text-zinc-400">{result.total} товаров</span>
        </h1>
        <SortSelect />
      </div>

      {isBags && (
        <div className="mb-5 flex gap-2">
          {BAG_KINDS.map((kind) => (
            <Link
              key={kind.slug}
              href={`/catalog?category=${kind.slug}`}
              className={`rounded-full px-5 py-2 text-sm font-bold shadow-card transition-all duration-300 hover:-translate-y-0.5 ${
                category === kind.slug
                  ? "bg-gradient-to-r from-brand-400 to-brand-500 text-white shadow-glow"
                  : "bg-white text-zinc-600 hover:text-brand-600"
              }`}
            >
              {kind.label}
            </Link>
          ))}
        </div>
      )}

      {isClothing && (
        <div className="mb-5 flex gap-2">
          {CLOTHING_KINDS.map((kind) => (
            <Link
              key={kind.gender}
              href={`/catalog?category=clothing${gender === kind.gender ? "" : `&gender=${kind.gender}`}`}
              className={`rounded-full px-5 py-2 text-sm font-bold shadow-card transition-all duration-300 hover:-translate-y-0.5 ${
                gender === kind.gender
                  ? "bg-gradient-to-r from-brand-400 to-brand-500 text-white shadow-glow"
                  : "bg-white text-zinc-600 hover:text-brand-600"
              }`}
            >
              {kind.label}
            </Link>
          ))}
        </div>
      )}

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
            <InfiniteProducts
              key={queryString}
              initial={result.items.map((p) => ({
                slug: p.slug,
                name: p.name,
                basePrice: p.basePrice,
                ratingAvg: p.ratingAvg,
                ratingCount: p.ratingCount,
                images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
              }))}
              totalPages={result.totalPages}
              query={queryString}
            />
          )}
        </div>
      </div>
    </div>
  );
}

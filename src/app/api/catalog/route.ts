import { NextResponse } from "next/server";
import { queryCatalog } from "@/services/catalog";
import type { SortValue } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Подгрузка страниц каталога для бесконечной ленты (без кнопок пагинации). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const priceMin = sp.get("priceMin");
  const priceMax = sp.get("priceMax");

  const result = await queryCatalog({
    category: sp.get("category") ?? undefined,
    gender: sp.get("gender") ?? undefined,
    q: sp.get("q") ?? undefined,
    sizes: sp.getAll("size"),
    colors: sp.getAll("color"),
    priceMin: priceMin ? Math.round(Number(priceMin) * 100) : undefined,
    priceMax: priceMax ? Math.round(Number(priceMax) * 100) : undefined,
    inStock: sp.get("inStock") === "1",
    sort: (sp.get("sort") as SortValue) ?? "new",
    page: Math.max(1, Number(sp.get("page")) || 1),
  });

  return NextResponse.json({
    page: result.page,
    totalPages: result.totalPages,
    items: result.items.map((p) => ({
      slug: p.slug,
      name: p.name,
      basePrice: p.basePrice,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    })),
  });
}

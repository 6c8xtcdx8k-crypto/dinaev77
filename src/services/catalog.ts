import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CATALOG_PAGE_SIZE, type SortValue } from "@/lib/constants";

export type CatalogFilters = {
  category?: string; // slug
  gender?: string;
  q?: string;
  sizes?: string[];
  colors?: string[];
  priceMin?: number; // копейки
  priceMax?: number;
  inStock?: boolean;
  sort?: SortValue;
  page?: number;
  line?: string; // линейка обуви: "luxe" (poxqn+OmniSellers) | "other" (KrossBar)
};

function buildWhere(f: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (f.category) {
    where.category = { slug: f.category };
  } else if (f.gender === "WOMEN" || f.gender === "MEN") {
    // Разделы «Женская/Мужская» — это одежда: сумки в них не показываем,
    // даже если ссылка пришла из кэша без явной категории.
    where.category = { slug: "clothing" };
  }
  if (f.gender === "WOMEN" || f.gender === "MEN") {
    // Для обуви разделы «Женские/Мужские кроссовки» строгие: показываем только
    // товары своего пола (UNISEX-кроссовки живут в общем разделе «Обувь»).
    // Для одежды оставляем UNISEX в обоих разделах, как и раньше.
    where.gender =
      f.category === "shoes" ? f.gender : { in: [f.gender, "UNISEX"] };
  }

  // Линейка обуви по поставщику (по префиксу slug):
  //  luxe  — брендовые модели poxqn (shoe-) и OmniSellers (omni-)
  //  other — KrossBar (krb-)
  if (f.line === "luxe") {
    where.AND = [
      { OR: [{ slug: { startsWith: "shoe-" } }, { slug: { startsWith: "omni-" } }] },
    ];
  } else if (f.line === "other") {
    where.slug = { startsWith: "krb-" };
  }
  if (f.q) {
    const q = f.q.trim();
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      // Поиск по артикулу: артикулы в верхнем регистре (SB100001),
      // поэтому нормализуем запрос — «sb100001» и «100001» тоже находят.
      { article: { contains: q.toUpperCase() } },
    ];
  }
  // Фильтры по вариантам: размер/цвет/наличие должны совпадать в одном варианте.
  const variantAnd: Prisma.VariantWhereInput = {};
  if (f.sizes?.length) variantAnd.size = { in: f.sizes };
  if (f.colors?.length) variantAnd.color = { in: f.colors };
  if (f.inStock) variantAnd.stock = { gt: 0 };
  if (Object.keys(variantAnd).length > 0) where.variants = { some: variantAnd };

  return where;
}

function orderBy(sort: SortValue | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ basePrice: "asc" }];
    case "price_desc":
      return [{ basePrice: "desc" }];
    case "popular":
      return [{ salesCount: "desc" }, { ratingCount: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "new":
    default:
      // По умолчанию — сначала новинки (самые свежие товары вверху).
      return [{ createdAt: "desc" }];
  }
}

export async function queryCatalog(f: CatalogFilters) {
  const where = buildWhere(f);

  // basePrice — актуальная цена продажи, фильтруем по ней прямо в SQL.
  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    where.basePrice = {
      ...(f.priceMin !== undefined ? { gte: f.priceMin } : {}),
      ...(f.priceMax !== undefined ? { lte: f.priceMax } : {}),
    };
  }

  // Пагинацию делаем в базе (skip/take), а не выгружаем всю категорию в память:
  // это резко снижает объём данных, вытягиваемых из Neon на каждый заход.
  const page = Math.max(1, f.page ?? 1);
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderBy(f.sort),
      include: {
        images: { orderBy: { sort: "asc" }, take: 1 },
        variants: { select: { size: true, color: true, colorHex: true, stock: true } },
      },
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  return { items, total, page, totalPages };
}

/**
 * Доступные значения фильтров (размеры/цвета/границы цен) для текущей выборки.
 * Требует полного скана категории, поэтому кешируем результат на 10 минут —
 * набор размеров/цветов/цен меняется редко, а трафик из Neon экономит сильно.
 */
export const getFilterFacets = unstable_cache(
  _getFilterFacets,
  ["catalog-facets"],
  { revalidate: 600 },
);

async function _getFilterFacets(f: Pick<CatalogFilters, "category" | "gender">) {
  const where = buildWhere(f);
  const products = await prisma.product.findMany({
    where,
    select: {
      basePrice: true,
      variants: { select: { size: true, color: true, colorHex: true } },
    },
  });

  const sizes = new Set<string>();
  const colors = new Map<string, string>();
  let min = Infinity;
  let max = 0;

  for (const p of products) {
    min = Math.min(min, p.basePrice);
    max = Math.max(max, p.basePrice);
    for (const v of p.variants) {
      sizes.add(v.size);
      if (!colors.has(v.color)) colors.set(v.color, v.colorHex);
    }
  }

  const sortedSizes = [...sizes].sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return {
    sizes: sortedSizes,
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    priceMin: min === Infinity ? 0 : min,
    priceMax: max,
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sort: "asc" } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getSimilarProducts(productId: string, categoryId: string, take = 4) {
  return prisma.product.findMany({
    where: { categoryId, isActive: true, id: { not: productId } },
    orderBy: { salesCount: "desc" },
    take,
    include: { images: { orderBy: { sort: "asc" }, take: 1 } },
  });
}

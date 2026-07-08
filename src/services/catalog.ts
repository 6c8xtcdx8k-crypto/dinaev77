import "server-only";
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
  sale?: boolean;
  sort?: SortValue;
  page?: number;
};

function buildWhere(f: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (f.category) where.category = { slug: f.category };
  if (f.gender === "WOMEN" || f.gender === "MEN") {
    where.gender = { in: [f.gender, "UNISEX"] };
  }
  if (f.q) {
    const q = f.q.trim();
    where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
  }
  if (f.sale) where.discountPercent = { gt: 0 };

  // Фильтры по вариантам: размер/цвет/наличие должны совпадать в одном варианте.
  const variantAnd: Prisma.VariantWhereInput = {};
  if (f.sizes?.length) variantAnd.size = { in: f.sizes };
  if (f.colors?.length) variantAnd.color = { in: f.colors };
  if (f.inStock) variantAnd.stock = { gt: 0 };
  if (Object.keys(variantAnd).length > 0) where.variants = { some: variantAnd };

  // Диапазон цен фильтруем по итоговой цене (basePrice со скидкой) ниже, в памяти
  // страницы это дорого — поэтому фильтруем по basePrice консервативно на уровне SQL,
  // а точную отсечку делаем после расчёта скидки.
  return where;
}

function orderBy(sort: SortValue | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ basePrice: "asc" }];
    case "price_desc":
      return [{ basePrice: "desc" }];
    case "new":
      return [{ createdAt: "desc" }];
    case "discount":
      return [{ discountPercent: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "popular":
    default:
      return [{ salesCount: "desc" }, { ratingCount: "desc" }];
  }
}

export async function queryCatalog(f: CatalogFilters) {
  const where = buildWhere(f);

  // basePrice — актуальная цена продажи, фильтруем по ней напрямую.
  const all = await prisma.product.findMany({
    where,
    orderBy: orderBy(f.sort),
    include: {
      images: { orderBy: { sort: "asc" }, take: 1 },
      variants: { select: { size: true, color: true, colorHex: true, stock: true } },
    },
  });

  const withFinal = all.filter(
    (p) =>
      (f.priceMin === undefined || p.basePrice >= f.priceMin) &&
      (f.priceMax === undefined || p.basePrice <= f.priceMax),
  );

  const page = Math.max(1, f.page ?? 1);
  const total = withFinal.length;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const items = withFinal.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);

  return { items, total, page, totalPages };
}

/** Доступные значения фильтров (размеры/цвета/границы цен) для текущей выборки. */
export async function getFilterFacets(f: Pick<CatalogFilters, "category" | "gender">) {
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

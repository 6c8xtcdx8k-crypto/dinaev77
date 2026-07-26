/**
 * Импорт дополнительных товаров из scripts/extra-products.json.
 * Фото уже лежат во внешнем хранилище (Cloudinary) — в поле photos готовые
 * URL, поэтому здесь ничего не скачивается и в БД не пишутся картинки:
 * ProductImage.url = прямая ссылка (магазин отдаёт её через обычный <img>).
 * Идемпотентно: товар ищется по slug, существующие пропускаются.
 *
 * Артикулы этим товарам присваивает ensureArticles() из import-channel.ts,
 * который в сборке запускается следом.
 *
 * Запуск вручную: npx tsx scripts/import-extra.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();
const FILE = path.join(process.cwd(), "scripts", "extra-products.json");
const STOCK_PER_VARIANT = Math.max(0, Number(process.env.IMPORT_STOCK ?? 10));

type ExtraProduct = {
  slug: string;
  name: string;
  description: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  category: string; // clothing | bags | shoes
  priceRub: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  photos: string[]; // готовые URL (Cloudinary)
};

function makeSku(slug: string, color: string, size: string): string {
  return `${slug}-${color}-${size}`.toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-");
}
function cleanColorName(name: string): string {
  return name.replace(/[.…!\s]+$/g, "").trim() || name;
}

async function main() {
  // Читаем оба источника: одежда (extra-products.json) и обувь (shoes-products.json).
  const SHOES = path.join(process.cwd(), "scripts", "shoes-products.json");
  const items: ExtraProduct[] = [];
  for (const f of [FILE, SHOES]) {
    if (existsSync(f)) {
      const part: ExtraProduct[] = JSON.parse(readFileSync(f, "utf8"));
      items.push(...part);
      console.log(`[extra] ${path.basename(f)}: ${part.length}`);
    }
  }
  if (items.length === 0) {
    console.log("[extra] нет файлов с товарами — пропуск");
    return;
  }
  console.log(`[extra] всего товаров: ${items.length}`);

  const CATEGORY_DEFS = [
    { slug: "clothing", name: "Одежда", sort: 1 },
    { slug: "bags", name: "Сумки", sort: 2 },
    { slug: "shoes", name: "Обувь", sort: 4 },
  ];
  const catBySlug = new Map<string, string>();
  for (const c of CATEGORY_DEFS) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    catBySlug.set(c.slug, cat.id);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (!item.photos || item.photos.length === 0) {
        failed++;
        continue;
      }
      const exists = await prisma.product.findUnique({ where: { slug: item.slug } });
      if (exists) {
        skipped++;
        continue;
      }
      const categoryId = catBySlug.get(item.category) ?? catBySlug.get("clothing")!;

      // Варианты: размеры × цвета, без дублей (productId,size,color уникален).
      const seen = new Set<string>();
      const variants: { sku: string; size: string; color: string; colorHex: string; stock: number }[] = [];
      for (const color of item.colors) {
        const cn = cleanColorName(color.name);
        for (const size of item.sizes) {
          const key = `${size}|${cn}`;
          if (seen.has(key)) continue;
          seen.add(key);
          variants.push({
            sku: makeSku(item.slug, cn, size),
            size,
            color: cn,
            colorHex: color.hex || "#7a7a7a",
            stock: STOCK_PER_VARIANT,
          });
        }
      }

      await prisma.product.create({
        data: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          categoryId,
          gender: item.gender ?? "UNISEX",
          basePrice: Math.round(item.priceRub * 100),
          isActive: true,
          images: { create: item.photos.map((url, i) => ({ url, alt: item.name, sort: i })) },
          variants: { create: variants },
        },
      });
      created++;
      if (created % 25 === 0) console.log(`[extra] создано ${created}`);
    } catch (err) {
      failed++;
      console.error(`[extra] ${item.slug}: ошибка —`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[extra] готово: создано ${created}, уже было ${skipped}, с ошибкой ${failed}`);
}

main()
  .catch((e) => console.error("[extra] ФАТАЛЬНАЯ ОШИБКА (деплой продолжается):", e))
  .finally(() => prisma.$disconnect());

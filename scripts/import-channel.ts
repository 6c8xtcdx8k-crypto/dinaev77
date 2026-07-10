/**
 * Импорт товаров, собранных из Telegram-канала поставщика,
 * в каталог магазина (scripts/channel-products.json).
 *
 * Идемпотентен: товар ищется по slug, существующие пропускаются, поэтому
 * скрипт безопасно запускается при каждом старте контейнера (entrypoint).
 * Фотографии скачиваются с CDN Telegram в UPLOAD_DIR и раздаются
 * маршрутом /uploads/[file] со своего домена.
 *
 * Запуск вручную: npx tsx scripts/import-channel.ts
 */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";

const prisma = new PrismaClient();

const DATA_FILE = path.join(process.cwd(), "scripts", "channel-products.json");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const STOCK_PER_VARIANT = Math.max(0, Number(process.env.IMPORT_STOCK ?? 10));
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

type ChannelProduct = {
  postId: number;
  slug: string;
  name: string;
  description: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  category?: "clothing" | "bags"; // по умолчанию clothing
  priceRub: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  photos: string[];
};

/**
 * Сохраняет фото товара и возвращает URL для ProductImage:
 * - есть BLOB_READ_WRITE_TOKEN (Vercel) — скачиваем в Vercel Blob,
 *   раздаётся через /uploads/[file] со своего домена;
 * - Vercel без Blob — используем исходный URL CDN Telegram (диск
 *   в serverless-окружении не переживает деплой);
 * - иначе (VPS/локально) — скачиваем на диск в UPLOAD_DIR.
 */
async function downloadPhoto(url: string, attempt = 1): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.VERCEL) return url;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      if (attempt < 2) return downloadPhoto(url, attempt + 1);
      return null;
    }
    const type = res.headers.get("content-type") ?? "";
    const ext = type.includes("png") ? ".png" : type.includes("webp") ? ".webp" : ".jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) return null;
    const name = `${randomUUID()}${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      await put(`products/${name}`, buf, {
        access: "public",
        contentType: type || "image/jpeg",
      });
      return `/uploads/${name}`;
    }

    mkdirSync(UPLOAD_DIR, { recursive: true });
    writeFileSync(path.join(UPLOAD_DIR, name), buf);
    return `/uploads/${name}`;
  } catch {
    if (attempt < 2) return downloadPhoto(url, attempt + 1);
    return null;
  }
}

function makeSku(slug: string, color: string, size: string): string {
  return `${slug}-${color}-${size}`.toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-");
}

/** Убирает хвостовую пунктуацию из названия цвета («Чёрный.» → «Чёрный»). */
function cleanColorName(name: string): string {
  return name.replace(/[.…!\s]+$/g, "").trim() || name;
}

/** Демо-товары сида: убраны из магазина, реальный ассортимент — из каналов. */
const DEMO_SLUGS = [
  "berry-hoodie", "berry-tshirt-basic", "berry-dress-midi", "berry-jeans-m",
  "berry-puffer-w", "berry-shirt-m", "berry-leggings-w", "berry-cap",
  "berry-bag-tote", "berry-bag-cross", "berry-bag-shopper", "berry-bag-clutch",
];

/** Удаляет демо-товары и демо-покупателя. История заказов не страдает:
 *  позиции заказов хранят снимки, а ссылки на варианты обнуляются (SetNull). */
async function removeDemoData(): Promise<void> {
  const gone = await prisma.product.deleteMany({ where: { slug: { in: DEMO_SLUGS } } });
  if (gone.count > 0) console.log(`[import] удалено демо-товаров: ${gone.count}`);
  const demoUser = await prisma.user.deleteMany({
    where: { email: "customer@example.com", role: "CUSTOMER" },
  });
  if (demoUser.count > 0) console.log("[import] удалён демо-покупатель customer@example.com");
}

/** Поставщик сумок не отправляет — снимаем ранее импортированные сумки
 *  (slug вида ...-b<номер поста>) с витрины. */
async function removeBagsImport(): Promise<void> {
  const candidates = await prisma.product.findMany({
    where: { slug: { contains: "-b" } },
    select: { id: true, slug: true },
  });
  const ids = candidates.filter((p) => /-b\d+$/.test(p.slug)).map((p) => p.id);
  if (ids.length === 0) return;
  const gone = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log(`[import] удалено сумок (поставщик не отправляет): ${gone.count}`);
}

/** Разовая уборка: чинит названия цветов у ранее импортированных вариантов. */
async function fixExistingColorNames(): Promise<void> {
  const dirty = await prisma.variant.findMany({
    where: { color: { endsWith: "." } },
    select: { id: true, color: true },
  });
  for (const v of dirty) {
    await prisma.variant
      .update({ where: { id: v.id }, data: { color: cleanColorName(v.color) } })
      .catch(() => {}); // конфликт уникальности (productId,size,color) — пропускаем
  }
  if (dirty.length > 0) console.log(`[import] исправлено названий цветов: ${dirty.length}`);
}

/**
 * Самовосстановление фото (Blob-режим): если файл картинки пропал из
 * хранилища (например, загружен до подключения Blob), скачиваем заново
 * с исходного CDN Telegram по ссылкам из channel-products.json.
 */
async function repairImportedPhotos(items: ChannelProduct[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const { list } = await import("@vercel/blob");
  // Один список всех файлов вместо тысяч точечных проверок
  const existing = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "products/", limit: 1000, cursor });
    for (const b of page.blobs) existing.add(b.pathname.slice("products/".length));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  console.log(`[repair] файлов в хранилище: ${existing.size}`);

  const bySlug = new Map(items.map((i) => [i.slug, i]));
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { sort: "asc" } } },
  });
  let fixed = 0;
  let lost = 0;
  for (const p of products) {
    const src = bySlug.get(p.slug);
    const broken = p.images.filter(
      (img) => img.url.startsWith("/uploads/") && !existing.has(img.url.slice("/uploads/".length)),
    );
    if (broken.length === 0) continue;
    if (!src) {
      lost += broken.length; // ручные загрузки: оригинала нет
      continue;
    }
    await Promise.all(
      broken.map(async (img) => {
        const idx = p.images.findIndex((i) => i.id === img.id);
        const orig = src.photos[idx] ?? src.photos[0];
        if (!orig) return;
        const fresh = await downloadPhoto(orig);
        if (fresh) {
          await prisma.productImage.update({ where: { id: img.id }, data: { url: fresh } });
          fixed++;
        }
      }),
    );
  }
  if (fixed > 0 || lost > 0) {
    console.log(`[repair] восстановлено фото: ${fixed}; без оригинала (ручные): ${lost}`);
  }
}

async function main() {
  if (!existsSync(DATA_FILE)) {
    console.log("[import] scripts/channel-products.json не найден — нечего импортировать");
    return;
  }
  const items: ChannelProduct[] = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  console.log(`[import] товаров в файле: ${items.length}`);

  await removeDemoData();
  await removeBagsImport();
  await fixExistingColorNames();
  await repairImportedPhotos(items);

  const clothing = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: { slug: "clothing", name: "Одежда", sort: 1 },
  });
  const bags = await prisma.category.upsert({
    where: { slug: "bags" },
    update: {},
    create: { slug: "bags", name: "Сумки", sort: 2 },
  });
  const categoryId = (item: ChannelProduct) => (item.category === "bags" ? bags.id : clothing.id);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const exists = await prisma.product.findUnique({ where: { slug: item.slug } });
      if (exists) {
        skipped++;
        continue;
      }

      const urls: string[] = [];
      for (const photo of item.photos) {
        const saved = await downloadPhoto(photo);
        if (saved) urls.push(saved);
      }
      if (urls.length === 0) {
        console.log(`[import] ${item.slug}: не удалось скачать ни одного фото — пропуск`);
        failed++;
        continue;
      }

      await prisma.product.create({
        data: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          categoryId: categoryId(item),
          gender: item.gender ?? "WOMEN",
          basePrice: Math.round(item.priceRub * 100),
          isActive: true,
          images: {
            create: urls.map((url, i) => ({ url, alt: item.name, sort: i })),
          },
          variants: {
            create: item.colors.flatMap((color) =>
              item.sizes.map((size) => ({
                sku: makeSku(item.slug, cleanColorName(color.name), size),
                size,
                color: cleanColorName(color.name),
                colorHex: color.hex,
                stock: STOCK_PER_VARIANT,
              })),
            ),
          },
        },
      });
      created++;
      console.log(`[import] + ${item.name} (${item.priceRub} ₽, фото: ${urls.length})`);
    } catch (err) {
      failed++;
      console.error(`[import] ${item.slug}: ошибка —`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[import] готово: создано ${created}, уже было ${skipped}, с ошибкой ${failed}`);
}

main()
  .catch((e) => {
    // Импорт не должен блокировать деплой: при фатальной ошибке сайт
    // выкатывается со старым каталогом, ошибка видна в логе сборки.
    console.error("[import] ФАТАЛЬНАЯ ОШИБКА (деплой продолжается):", e);
  })
  .finally(() => prisma.$disconnect());

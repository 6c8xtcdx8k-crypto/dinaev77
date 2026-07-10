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
  priceRub: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  photos: string[];
};

async function downloadPhoto(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    const ext = type.includes("png") ? ".png" : type.includes("webp") ? ".webp" : ".jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) return null;
    mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}${ext}`;
    writeFileSync(path.join(UPLOAD_DIR, name), buf);
    return `/uploads/${name}`;
  } catch {
    return null;
  }
}

function makeSku(slug: string, color: string, size: string): string {
  return `${slug}-${color}-${size}`.toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-");
}

async function main() {
  if (!existsSync(DATA_FILE)) {
    console.log("[import] scripts/channel-products.json не найден — нечего импортировать");
    return;
  }
  const items: ChannelProduct[] = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  console.log(`[import] товаров в файле: ${items.length}`);

  const category = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: { slug: "clothing", name: "Одежда", sort: 1 },
  });

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
          categoryId: category.id,
          gender: item.gender ?? "WOMEN",
          basePrice: Math.round(item.priceRub * 100),
          isActive: true,
          images: {
            create: urls.map((url, i) => ({ url, alt: item.name, sort: i })),
          },
          variants: {
            create: item.colors.flatMap((color) =>
              item.sizes.map((size) => ({
                sku: makeSku(item.slug, color.name, size),
                size,
                color: color.name,
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
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

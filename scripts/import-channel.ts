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
const COLORS_FILE = path.join(process.cwd(), "scripts", "product-colors.json");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const STOCK_PER_VARIANT = Math.max(0, Number(process.env.IMPORT_STOCK ?? 10));
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

type ChannelProduct = {
  postId: number;
  slug: string;
  name: string;
  description: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  category?: "clothing" | "bags" | "bags-lux"; // по умолчанию clothing
  priceRub: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  photos: string[];
};

/**
 * Сохраняет фото товара и возвращает URL для ProductImage (/uploads/<имя>).
 * Ссылки CDN Telegram протухают за часы, поэтому фото всегда копируются:
 * - Vercel: сжимаются (sharp, ширина ≤900, JPEG) и кладутся в БД (Upload) —
 *   бесплатно и навсегда; Blob-режим возвращается переменной USE_BLOB=1;
 * - VPS/локально: на диск в UPLOAD_DIR, как раньше.
 */
async function downloadPhoto(url: string, attempt = 1): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(12000), // не зависаем на мёртвых ссылках
    });
    if (!res.ok) {
      if (attempt < 2) return downloadPhoto(url, attempt + 1);
      return null;
    }
    const type = res.headers.get("content-type") ?? "";
    let buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) return null;
    let ext = type.includes("png") ? ".png" : type.includes("webp") ? ".webp" : ".jpg";

    if (process.env.USE_BLOB === "1" && process.env.BLOB_READ_WRITE_TOKEN) {
      const name = `${randomUUID()}${ext}`;
      const { put } = await import("@vercel/blob");
      await put(`products/${name}`, buf, {
        access: "public",
        contentType: type || "image/jpeg",
      });
      return `/uploads/${name}`;
    }

    if (process.env.VERCEL) {
      // Сжимаем, чтобы уместить каталог в бесплатный лимит БД
      try {
        const sharp = (await import("sharp")).default;
        buf = Buffer.from(
          await sharp(buf).rotate().resize({ width: 900, withoutEnlargement: true })
            .jpeg({ quality: 72 }).toBuffer(),
        );
        ext = ".jpg";
      } catch {
        /* sharp недоступен — сохраняем как есть */
      }
      const name = `${randomUUID()}${ext}`;
      await prisma.upload.create({
        data: { name, mime: "image/jpeg", data: new Uint8Array(buf) },
      });
      return `/uploads/${name}`;
    }

    const name = `${randomUUID()}${ext}`;
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
 * Переносит фото уже импортированных товаров в БД (Vercel):
 * прежние схемы (Blob → его заблокировали; прямые CDN-ссылки → они
 * протухают за часы) оставили карточки с недоступными картинками.
 * Товар считается здоровым, когда все его фото — /uploads/<имя>,
 * и это имя есть в таблице Upload; остальные пересобираются из свежих
 * ссылок channel-products.json. Прогресс переживает таймаут сборки:
 * записи в БД остаются, следующая сборка продолжит с места остановки.
 */
async function ingestPhotosToDb(items: ChannelProduct[]): Promise<void> {
  if (!process.env.VERCEL || process.env.USE_BLOB === "1") return;
  const uploads = new Set(
    (await prisma.upload.findMany({ select: { name: true } })).map((u) => u.name),
  );
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { sort: "asc" } } },
  });
  let fixed = 0;
  let failed = 0;
  for (const p of products) {
    const src = bySlug.get(p.slug);
    if (!src) continue; // ручные товары чинит fixManualProductPhotos
    const healthy =
      p.images.length > 0 &&
      p.images.every(
        (i) => i.url.startsWith("/uploads/") && uploads.has(i.url.slice("/uploads/".length)),
      );
    if (healthy) continue;

    const fresh: string[] = [];
    for (const photo of src.photos) {
      const saved = await downloadPhoto(photo);
      if (saved) fresh.push(saved);
    }
    if (fresh.length === 0) {
      failed++; // свежие ссылки недоступны — оставляем как есть
      continue;
    }
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: p.id } }),
      prisma.productImage.createMany({
        data: fresh.map((url, i) => ({ productId: p.id, url, alt: p.name, sort: i })),
      }),
    ]);
    fixed++;
    if (fixed % 25 === 0) console.log(`[ingest] перенесено товаров: ${fixed}`);
  }
  if (fixed > 0 || failed > 0) {
    console.log(`[ingest] фото в БД: исправлено ${fixed} товаров, не удалось ${failed}`);
  }
}

/**
 * Фото для товаров, созданных владельцем вручную: их оригиналы остались
 * в заблокированном Blob-хранилище. scripts/manual-photos.json — подобранные
 * фотографии исходных постов канала поставщика (slug → CDN-ссылки).
 */
async function fixManualProductPhotos(): Promise<void> {
  const file = path.join(process.cwd(), "scripts", "manual-photos.json");
  if (!existsSync(file)) return;
  const map: Record<string, string[]> = JSON.parse(readFileSync(file, "utf8"));
  const uploads = new Set(
    (await prisma.upload.findMany({ select: { name: true } })).map((u) => u.name),
  );
  let fixed = 0;
  for (const [slug, photos] of Object.entries(map)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    });
    if (!product) continue;
    // Здоровый товар: все фото в БД (/uploads + запись в Upload).
    const healthy =
      product.images.length > 0 &&
      (!process.env.VERCEL ||
        product.images.every(
          (i) => i.url.startsWith("/uploads/") && uploads.has(i.url.slice("/uploads/".length)),
        ));
    if (healthy) continue;

    const fresh: { url: string; sort: number }[] = [];
    for (const [i, url] of photos.entries()) {
      const saved = await downloadPhoto(url);
      if (saved) fresh.push({ url: saved, sort: i });
    }
    if (fresh.length === 0) continue; // ссылки недоступны — не трогаем текущие
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: product.id } }),
      prisma.productImage.createMany({
        data: fresh.map((f) => ({ productId: product.id, url: f.url, alt: product.name, sort: f.sort })),
      }),
    ]);
    fixed++;
    console.log(`[manual] ${slug}: фото обновлены (${fresh.length})`);
  }
  if (fixed > 0) console.log(`[manual] исправлено товаров: ${fixed}`);
}

/**
 * Удаляет фотографии из чёрного списка (scripts/banned-photos.json) —
 * QR-визитки поставщиков, попавшие в фотоальбомы постов.
 * Список пополняется сканером scripts/scan-qr.mjs.
 */
async function removeBannedPhotos(): Promise<void> {
  const file = path.join(process.cwd(), "scripts", "banned-photos.json");
  if (!existsSync(file)) return;
  const banned: string[] = JSON.parse(readFileSync(file, "utf8"));
  if (banned.length === 0) return;
  const gone = await prisma.productImage.deleteMany({ where: { url: { in: banned } } });
  if (gone.count > 0) console.log(`[import] удалено фото с QR-кодами: ${gone.count}`);
}

// ---------- Единоразовая замена старой партии Avrora на чистую ----------

/**
 * Старые товары Avrora (43xxx–44xxx и первый повтор 45xxx) несли впечатанный
 * штамп поставщика и были испорчены обрезкой; ссылки на их оригиналы мертвы.
 * Удаляем ВСЕ товары Avrora из базы (slug вида «-<цифры>» без буквенного
 * префикса — только у Avrora), после чего обычный импорт создаёт их заново
 * из свежего чистого стока (channel-products.json) — уже без штампов и без
 * обрезки. Выполняется один раз (флаг в Setting); история заказов не страдает
 * (позиции хранят снимки). При смене стока флаг можно поднять до _v2 и т.д.
 */
async function resetAvroraOnce(): Promise<void> {
  const KEY = "avroraCleanReset_v2";
  const flag = await prisma.setting.findUnique({ where: { key: KEY } });
  if (flag) return;
  // Avrora: slug оканчивается «-<postId>» без буквенного префикса, а postId
  // у канала пятизначный (≥40000). Порог защищает товары, созданные владельцем
  // вручную через админку (у них таких длинных числовых хвостов нет).
  const all = await prisma.product.findMany({ select: { id: true, slug: true } });
  const ids = all
    .filter((p) => {
      const m = p.slug.match(/-(\d+)$/);
      return m !== null && !/-[a-z]\d+$/.test(p.slug) && Number(m[1]) >= 40000;
    })
    .map((p) => p.id);
  if (ids.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    console.log(`[avrora] удалено старых товаров: ${ids.length} — переимпорт чистых`);
  }
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: "1" },
    create: { key: KEY, value: "1" },
  });
}

/**
 * Единоразовая замена партии Azizov (slug «-az<postId>»): при смене цены/метки
 * старые товары удаляются, обычный импорт создаёт их заново из свежего стока.
 * Флаг в Setting; поднимайте версию при каждом обновлении стока Azizov.
 */
async function resetAzizovOnce(): Promise<void> {
  const KEY = "azizovReset_v1";
  const flag = await prisma.setting.findUnique({ where: { key: KEY } });
  if (flag) return;
  const all = await prisma.product.findMany({ select: { id: true, slug: true } });
  const ids = all.filter((p) => /-az\d+$/.test(p.slug)).map((p) => p.id);
  if (ids.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    console.log(`[azizov] удалено старых товаров: ${ids.length} — переимпорт свежих`);
  }
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: "1" },
    create: { key: KEY, value: "1" },
  });
}

/**
 * Единоразовая замена партии mens_homeSadovod (slug «-m<postId>»): старые
 * товары удаляются, обычный импорт создаёт их заново из свежего стока.
 * Флаг в Setting; поднимайте версию при каждом обновлении стока.
 */
async function resetMensOnce(): Promise<void> {
  const KEY = "mensReset_v2";
  const flag = await prisma.setting.findUnique({ where: { key: KEY } });
  if (flag) return;
  const all = await prisma.product.findMany({ select: { id: true, slug: true } });
  const ids = all.filter((p) => /-m\d+$/.test(p.slug)).map((p) => p.id);
  if (ids.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    console.log(`[mens] удалено старых товаров: ${ids.length} — переимпорт свежих`);
  }
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: "1" },
    create: { key: KEY, value: "1" },
  });
}

/** Цвета-заглушки: у таких товаров реальный цвет определяем по фото. */
const PLACEHOLDER_COLORS = new Set([
  "Как на фото", "Как на фото.", "В ассортимент", "В ассортименте",
  "Мультиколор", "Ассорти", "Разные", "",
]);

/**
 * Проставляет реальный цвет товарам с цветом-заглушкой («Как на фото») по
 * заранее вычисленной карте scripts/product-colors.json (анализ главного фото
 * товара). Товары с уже указанным реальным или несколькими цветами (например,
 * мужская одежда) не трогаются. Идемпотентно: после замены цвет уже не
 * заглушка — повторный прогон его пропускает. История заказов не страдает:
 * позиции хранят снимок цвета на момент покупки.
 */
async function syncColorsFromPhotos(): Promise<void> {
  if (!existsSync(COLORS_FILE)) return;
  let map: Record<string, { name: string; hex: string }>;
  try {
    map = JSON.parse(readFileSync(COLORS_FILE, "utf8"));
  } catch {
    return;
  }
  let updated = 0;
  for (const [slug, col] of Object.entries(map)) {
    if (!col?.name) continue;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });
    if (!product || product.variants.length === 0) continue;
    const distinct = [...new Set(product.variants.map((v) => v.color))];
    // только у товаров с единственным цветом-заглушкой
    if (distinct.length !== 1 || !PLACEHOLDER_COLORS.has(distinct[0])) continue;
    for (const v of product.variants) {
      await prisma.variant
        .update({
          where: { id: v.id },
          data: { color: col.name, colorHex: col.hex, sku: makeSku(slug, col.name, v.size) },
        })
        .catch(() => {}); // редкий конфликт уникальности — пропускаем
    }
    updated++;
  }
  if (updated > 0) console.log(`[import] цвета по фото проставлены: ${updated}`);
}

async function main() {
  if (!existsSync(DATA_FILE)) {
    console.log("[import] scripts/channel-products.json не найден — нечего импортировать");
    return;
  }
  const items: ChannelProduct[] = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  console.log(`[import] товаров в файле: ${items.length}`);

  // Цвета по фото проставляем в самом начале и в своём try/catch: это касается
  // только уже существующих товаров и не должно зависеть от загрузки фото ниже
  // (которая может падать на протухших ссылках Telegram).
  try {
    await syncColorsFromPhotos();
  } catch (err) {
    console.error("[import] syncColorsFromPhotos:", err instanceof Error ? err.message : err);
  }

  await removeDemoData();
  await fixExistingColorNames();
  await removeBannedPhotos();
  await ingestPhotosToDb(items);
  await fixManualProductPhotos();
  await resetAvroraOnce(); // разово удаляем старую партию Avrora — заменится чистой
  await resetAzizovOnce(); // разово удаляем старую партию Azizov — заменится свежей (+800, «+9»)
  await resetMensOnce(); // разово удаляем старую партию mens — заменится свежей

  const CATEGORY_DEFS = [
    { slug: "clothing", name: "Одежда", sort: 1 },
    { slug: "bags", name: "Сумки", sort: 2 },
    { slug: "bags-lux", name: "Сумки люкс", sort: 3 },
  ];
  const catBySlug = new Map<string, string>();
  for (const c of CATEGORY_DEFS) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
    catBySlug.set(c.slug, cat.id);
  }
  const categoryId = (item: ChannelProduct) =>
    catBySlug.get(item.category ?? "clothing") ?? catBySlug.get("clothing")!;

  // Синхронизация категории, пола И названия у уже импортированных товаров:
  // пол мог быть переопределён задним числом (например, товары Azizov «костюм
  // двойка» разнесены по мужской/женской), а названия сумок уточнены по типу
  // (клатч, шоппер, кросс-боди…) вместо общего «Женские сумки».
  let synced = 0;
  for (const item of items) {
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      select: { id: true, categoryId: true, gender: true, name: true },
    });
    if (!existing) continue;
    const wantCat = categoryId(item);
    const wantGender = item.gender ?? "WOMEN";
    if (existing.categoryId !== wantCat || existing.gender !== wantGender || existing.name !== item.name) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { categoryId: wantCat, gender: wantGender, name: item.name },
      });
      synced++;
    }
  }
  if (synced > 0) console.log(`[import] синхронизировано категория/пол/название: ${synced}`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Обрабатываем товары пулом (параллельно), а фото каждого качаем разом —
  // это в разы ускоряет наполнение по сравнению с последовательной загрузкой.
  const CONCURRENCY = 6;
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        const exists = await prisma.product.findUnique({ where: { slug: item.slug } });
        if (exists) {
          skipped++;
          continue;
        }

        const results = await Promise.all(item.photos.map((p) => downloadPhoto(p)));
        const urls = results.filter((u): u is string => !!u);
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
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`[import] готово: создано ${created}, уже было ${skipped}, с ошибкой ${failed}`);
}

main()
  .catch((e) => {
    // Импорт не должен блокировать деплой: при фатальной ошибке сайт
    // выкатывается со старым каталогом, ошибка видна в логе сборки.
    console.error("[import] ФАТАЛЬНАЯ ОШИБКА (деплой продолжается):", e);
  })
  .finally(() => prisma.$disconnect());

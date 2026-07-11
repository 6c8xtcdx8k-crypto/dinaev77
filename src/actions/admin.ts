"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus } from "@/services/orders";
import {
  connectInstagram,
  disconnectInstagram,
  publishProductToInstagram,
  type PublishResult,
} from "@/lib/instagram";
import type { OrderStatus } from "@/lib/constants";

/** Обновляет витрину после изменения товара: каталог, главную и карточку. */
function revalidateProduct(slug?: string) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/product/${slug}`);
}

export type AdminFormState = { error?: string; success?: boolean } | undefined;

// ---------- Товары ----------

const productSchema = z.object({
  name: z.string().min(2, "Укажите название"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: латиница, цифры и дефисы"),
  description: z.string().min(1, "Добавьте описание"),
  categoryId: z.string().min(1, "Выберите категорию"),
  gender: z.enum(["WOMEN", "MEN", "UNISEX"]),
  priceRub: z.coerce.number().positive("Цена должна быть больше нуля"),
  isActive: z.boolean(),
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    gender: formData.get("gender"),
    priceRub: formData.get("priceRub"),
    isActive: formData.get("isActive") === "on",
  });
}

export async function createProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exists = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { error: "Товар с таким slug уже существует" };

  const { priceRub, ...rest } = parsed.data;
  const product = await prisma.product.create({
    data: { ...rest, basePrice: Math.round(priceRub * 100) },
  });

  revalidateProduct(product.slug);
  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(
  productId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const clash = await prisma.product.findFirst({
    where: { slug: parsed.data.slug, id: { not: productId } },
  });
  if (clash) return { error: "Товар с таким slug уже существует" };

  const { priceRub, ...rest } = parsed.data;
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { ...rest, basePrice: Math.round(priceRub * 100) },
  });

  revalidateProduct(updated.slug);
  return { success: true };
}

/** Показать/скрыть товар в каталоге (мягкое скрытие). */
export async function toggleProductActiveAction(productId: string): Promise<void> {
  await requireAdmin();
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  });
  revalidateProduct(product.slug);
}

/**
 * Полное удаление товара. История заказов не страдает:
 * позиции заказов хранят снимки (название, цена, размер).
 */
export async function deleteProductPermanentlyAction(
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: "Товар не найден" };
  await prisma.product.delete({ where: { id: productId } });
  revalidateProduct(product.slug);
  redirect("/admin/products");
}

/** Быстрое изменение цены из таблицы товаров. */
export async function updateProductPriceAction(
  productId: string,
  priceRub: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!Number.isFinite(priceRub) || priceRub <= 0) {
    return { ok: false, error: "Цена должна быть больше нуля" };
  }
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await prisma.product.update({
    where: { id: productId },
    data: { basePrice: Math.round(priceRub * 100) },
  });
  revalidateProduct(product.slug);
  return { ok: true };
}

// ---------- Изображения ----------

export async function addProductImageAction(
  productId: string,
  url: string,
  alt = "",
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, error: "Укажите изображение" };
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url: trimmed, alt, sort: count },
  });
  revalidatePath(`/admin/products/${productId}`);
  revalidateProduct(product.slug);
  return { ok: true };
}

export async function deleteProductImageAction(imageId: string, productId: string): Promise<void> {
  await requireAdmin();
  await prisma.productImage.delete({ where: { id: imageId } });
  await resortImages(productId);
}

/** Сделать фото главным (оно показывается в каталоге и первым в галерее). */
export async function setMainImageAction(imageId: string, productId: string): Promise<void> {
  await requireAdmin();
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sort: "asc" },
  });
  const ordered = [
    ...images.filter((i) => i.id === imageId),
    ...images.filter((i) => i.id !== imageId),
  ];
  await Promise.all(
    ordered.map((img, i) =>
      prisma.productImage.update({ where: { id: img.id }, data: { sort: i } }),
    ),
  );
  await revalidateForProduct(productId);
}

/** Передвинуть фото влево/вправо в галерее. */
export async function moveImageAction(
  imageId: string,
  productId: string,
  direction: "left" | "right",
): Promise<void> {
  await requireAdmin();
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sort: "asc" },
  });
  const idx = images.findIndex((i) => i.id === imageId);
  const swap = direction === "left" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= images.length) return;
  await prisma.$transaction([
    prisma.productImage.update({ where: { id: images[idx].id }, data: { sort: swap } }),
    prisma.productImage.update({ where: { id: images[swap].id }, data: { sort: idx } }),
  ]);
  await revalidateForProduct(productId);
}

async function resortImages(productId: string): Promise<void> {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sort: "asc" },
  });
  await Promise.all(
    images.map((img, i) =>
      img.sort === i
        ? Promise.resolve()
        : prisma.productImage.update({ where: { id: img.id }, data: { sort: i } }),
    ),
  );
  await revalidateForProduct(productId);
}

async function revalidateForProduct(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  revalidatePath(`/admin/products/${productId}`);
  revalidateProduct(product?.slug);
}

// ---------- Варианты (размер/цвет/остаток) ----------

const variantSchema = z.object({
  size: z.string().min(1, "Размер обязателен"),
  color: z.string().min(1, "Цвет обязателен"),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Цвет в формате #RRGGBB"),
  stock: z.coerce.number().int().min(0),
});

export async function addVariantAction(
  productId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = variantSchema.safeParse({
    size: formData.get("size"),
    color: formData.get("color"),
    colorHex: formData.get("colorHex") || "#888888",
    stock: formData.get("stock") || 0,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exists = await prisma.variant.findUnique({
    where: {
      productId_size_color: {
        productId,
        size: parsed.data.size,
        color: parsed.data.color,
      },
    },
  });
  if (exists) return { error: "Такая комбинация размера и цвета уже есть" };

  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const sku = `${product.slug}-${parsed.data.color}-${parsed.data.size}`
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, "-");

  await prisma.variant.create({ data: { productId, sku, ...parsed.data } });
  await revalidateForProduct(productId);
  return { success: true };
}

/**
 * Массовое создание вариантов: все комбинации выбранных размеров и цветов
 * с одним стартовым остатком. Существующие комбинации пропускаются.
 */
export async function addVariantsBulkAction(
  productId: string,
  sizes: string[],
  colors: { name: string; hex: string }[],
  stock: number,
): Promise<{ ok: boolean; created?: number; skipped?: number; error?: string }> {
  await requireAdmin();

  const cleanSizes = [...new Set(sizes.map((s) => s.trim()).filter(Boolean))];
  const cleanColors = colors
    .map((c) => ({ name: c.name.trim(), hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#888888" }))
    .filter((c) => c.name);
  if (cleanSizes.length === 0) return { ok: false, error: "Выберите хотя бы один размер" };
  if (cleanColors.length === 0) return { ok: false, error: "Выберите хотя бы один цвет" };
  const safeStock = Math.max(0, Math.floor(stock) || 0);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: "Товар не найден" };

  const existing = await prisma.variant.findMany({
    where: { productId },
    select: { size: true, color: true },
  });
  const taken = new Set(existing.map((v) => `${v.color}::${v.size}`));

  let created = 0;
  let skipped = 0;
  for (const color of cleanColors) {
    for (const size of cleanSizes) {
      if (taken.has(`${color.name}::${size}`)) {
        skipped++;
        continue;
      }
      const sku = `${product.slug}-${color.name}-${size}`
        .toLowerCase()
        .replace(/[^a-z0-9а-яё-]+/gi, "-");
      await prisma.variant.create({
        data: { productId, size, color: color.name, colorHex: color.hex, sku, stock: safeStock },
      });
      created++;
    }
  }

  await revalidateForProduct(productId);
  return { ok: true, created, skipped };
}

export async function updateVariantStockAction(variantId: string, stock: number): Promise<void> {
  await requireAdmin();
  const variant = await prisma.variant.update({
    where: { id: variantId },
    data: { stock: Math.max(0, Math.floor(stock)) },
  });
  await revalidateForProduct(variant.productId);
}

export async function deleteVariantAction(variantId: string, productId: string): Promise<void> {
  await requireAdmin();
  await prisma.variant.delete({ where: { id: variantId } });
  await revalidateForProduct(productId);
}

// ---------- Заказы ----------

export async function setOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  comment = "",
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const res = await changeOrderStatus(orderId, status, comment);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}


// ---------- Instagram ----------

/** Публикует товар в Instagram (фото + подпись с ценой и ссылкой на бота). */
export async function publishToInstagramAction(productId: string): Promise<PublishResult> {
  await requireAdmin();
  return publishProductToInstagram(productId);
}

/** Подключает Instagram по токену: проверяет его и сохраняет в настройках. */
export async function connectInstagramAction(
  token: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  await requireAdmin();
  const res = await connectInstagram(token);
  revalidatePath("/admin/settings");
  return res;
}

export async function disconnectInstagramAction(): Promise<void> {
  await requireAdmin();
  await disconnectInstagram();
  revalidatePath("/admin/settings");
}

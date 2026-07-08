"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus } from "@/services/orders";
import { discountPercentFrom } from "@/lib/money";
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
  oldPriceRub: z.coerce.number().min(0).optional(),
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
    oldPriceRub: formData.get("oldPriceRub") || 0,
    isActive: formData.get("isActive") === "on",
  });
}

/** Цена продажи + старая цена → поля БД (копейки, процент для бейджа). */
function priceFields(priceRub: number, oldPriceRub?: number) {
  const basePrice = Math.round(priceRub * 100);
  const oldPrice =
    oldPriceRub && oldPriceRub > priceRub ? Math.round(oldPriceRub * 100) : null;
  return { basePrice, oldPrice, discountPercent: discountPercentFrom(basePrice, oldPrice) };
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

  const { priceRub, oldPriceRub, ...rest } = parsed.data;
  const product = await prisma.product.create({
    data: { ...rest, ...priceFields(priceRub, oldPriceRub) },
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

  const { priceRub, oldPriceRub, ...rest } = parsed.data;
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { ...rest, ...priceFields(priceRub, oldPriceRub) },
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
  const basePrice = Math.round(priceRub * 100);
  const oldPrice = product.oldPrice && product.oldPrice > basePrice ? product.oldPrice : null;
  await prisma.product.update({
    where: { id: productId },
    data: { basePrice, oldPrice, discountPercent: discountPercentFrom(basePrice, oldPrice) },
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

// ---------- Промокоды ----------

const promoSchema = z.object({
  code: z.string().min(2, "Код минимум 2 символа").transform((s) => s.trim().toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().positive("Значение должно быть больше нуля"),
  minOrderRub: z.coerce.number().min(0),
  usageLimit: z.coerce.number().int().min(0),
  endsAt: z.string().optional(),
});

export async function createPromoAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = promoSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderRub: formData.get("minOrderRub") || 0,
    usageLimit: formData.get("usageLimit") || 0,
    endsAt: (formData.get("endsAt") as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  if (parsed.data.type === "PERCENT" && parsed.data.value > 100) {
    return { error: "Процент скидки не может быть больше 100" };
  }

  const exists = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (exists) return { error: "Промокод с таким кодом уже существует" };

  await prisma.promoCode.create({
    data: {
      code: parsed.data.code,
      type: parsed.data.type,
      // PERCENT хранится как %, FIXED — в копейках
      value: parsed.data.type === "FIXED" ? Math.round(parsed.data.value * 100) : parsed.data.value,
      minOrderTotal: Math.round(parsed.data.minOrderRub * 100),
      usageLimit: parsed.data.usageLimit > 0 ? parsed.data.usageLimit : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    },
  });

  revalidatePath("/admin/promocodes");
  return { success: true };
}

export async function togglePromoAction(promoId: string): Promise<void> {
  await requireAdmin();
  const promo = await prisma.promoCode.findUniqueOrThrow({ where: { id: promoId } });
  await prisma.promoCode.update({
    where: { id: promoId },
    data: { isActive: !promo.isActive },
  });
  revalidatePath("/admin/promocodes");
}

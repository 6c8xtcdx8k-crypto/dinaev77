"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus } from "@/services/orders";
import { sendEmail } from "@/services/email";
import { returnStatusEmail } from "@/services/email/templates";
import { sendTelegramMessage } from "@/lib/telegram";
import {
  RETURN_STATUS_LABELS,
  RETURN_STATUS_TRANSITIONS,
  type OrderStatus,
  type ReturnStatus,
} from "@/lib/constants";

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
  discountPercent: z.coerce.number().int().min(0).max(90),
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
    discountPercent: formData.get("discountPercent") || 0,
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

  revalidatePath("/admin/products");
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
  await prisma.product.update({
    where: { id: productId },
    data: { ...rest, basePrice: Math.round(priceRub * 100) },
  });

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return { success: true };
}

export async function deleteProductAction(productId: string): Promise<void> {
  await requireAdmin();
  // Мягкое скрытие: у товара могут быть заказы/отзывы — не удаляем физически.
  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

// ---------- Изображения ----------

export async function addProductImageAction(
  productId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Укажите URL изображения" };
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, alt: String(formData.get("alt") ?? ""), sort: count },
  });
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteProductImageAction(imageId: string, productId: string): Promise<void> {
  await requireAdmin();
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/products/${productId}`);
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
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function updateVariantStockAction(variantId: string, stock: number): Promise<void> {
  await requireAdmin();
  await prisma.variant.update({
    where: { id: variantId },
    data: { stock: Math.max(0, Math.floor(stock)) },
  });
  revalidatePath("/admin/products");
}

export async function deleteVariantAction(variantId: string, productId: string): Promise<void> {
  await requireAdmin();
  await prisma.variant.delete({ where: { id: variantId } });
  revalidatePath(`/admin/products/${productId}`);
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

// ---------- Возвраты ----------

export async function setReturnStatusAction(
  returnId: string,
  status: ReturnStatus,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const req = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      orderItem: { include: { order: true } },
      user: { select: { telegramId: true } },
    },
  });
  if (!req) return { ok: false, error: "Заявка не найдена" };

  const allowed = RETURN_STATUS_TRANSITIONS[req.status as ReturnStatus] ?? [];
  if (!allowed.includes(status)) {
    return { ok: false, error: `Недопустимый переход: ${req.status} → ${status}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.returnRequest.update({ where: { id: returnId }, data: { status } });
    // Товар физически вернулся на склад — возвращаем остаток.
    if (status === "REFUNDED" && req.orderItem.variantId) {
      await tx.variant.update({
        where: { id: req.orderItem.variantId },
        data: { stock: { increment: req.orderItem.qty } },
      });
    }
  });

  // Уведомления покупателю (вне транзакции).
  const tpl = returnStatusEmail(
    { orderNumber: req.orderItem.order.number, productName: req.orderItem.productName },
    status,
  );
  void sendEmail({ to: req.orderItem.order.customerEmail, ...tpl });
  if (req.user.telegramId) {
    void sendTelegramMessage(
      req.user.telegramId,
      `Возврат «${req.orderItem.productName}» (заказ №${req.orderItem.order.number}): <b>${RETURN_STATUS_LABELS[status]}</b>.`,
    );
  }

  revalidatePath("/admin/returns");
  revalidatePath("/account/returns");
  return { ok: true };
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

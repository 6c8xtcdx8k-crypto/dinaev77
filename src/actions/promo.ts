"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getCart, getCartLines } from "@/lib/cart";
import { validatePromo, type PromoResult } from "@/lib/promo";

/**
 * Предпросмотр промокода на витрине: считает сумму товаров из текущей
 * корзины (не доверяем клиенту) и возвращает размер скидки или ошибку.
 */
export async function previewPromoAction(code: string): Promise<PromoResult> {
  const cart = await getCart();
  if (!cart) return { ok: false, error: "Корзина пуста" };
  const lines = await getCartLines(cart.id);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  return validatePromo(code, subtotal);
}

// ---------- Админка: управление промокодами ----------

export type PromoFormState = { error?: string; success?: string } | undefined;

const promoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Код слишком короткий")
    .max(32, "Код слишком длинный")
    .regex(/^[A-Za-z0-9_-]+$/, "Только латиница, цифры, дефис и подчёркивание"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Значение должно быть больше нуля"),
  minSubtotalRub: z.coerce.number().min(0).default(0),
  maxDiscountRub: z.coerce.number().min(0).default(0),
  usageLimit: z.coerce.number().int().min(0).default(0),
  expiresAt: z.string().optional(),
});

export async function createPromoAction(
  _prev: PromoFormState,
  formData: FormData,
): Promise<PromoFormState> {
  await requireAdmin();
  const parsed = promoSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotalRub: formData.get("minSubtotalRub") || 0,
    maxDiscountRub: formData.get("maxDiscountRub") || 0,
    usageLimit: formData.get("usageLimit") || 0,
    expiresAt: formData.get("expiresAt") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  if (d.type === "PERCENT" && d.value > 100) {
    return { error: "Процент скидки не может быть больше 100" };
  }

  const code = d.code.toUpperCase();
  const exists = await prisma.promoCode.findUnique({ where: { code } });
  if (exists) return { error: "Такой промокод уже существует" };

  // PERCENT: value — проценты как есть; FIXED: рубли → копейки.
  const value = d.type === "FIXED" ? Math.round(d.value * 100) : Math.round(d.value);

  await prisma.promoCode.create({
    data: {
      code,
      type: d.type,
      value,
      minSubtotal: Math.round(d.minSubtotalRub * 100),
      maxDiscount: Math.round(d.maxDiscountRub * 100),
      usageLimit: d.usageLimit,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    },
  });

  revalidatePath("/admin/promo");
  return { success: `Промокод ${code} создан` };
}

export async function togglePromoAction(id: string): Promise<void> {
  await requireAdmin();
  const promo = await prisma.promoCode.findUniqueOrThrow({ where: { id } });
  await prisma.promoCode.update({ where: { id }, data: { isActive: !promo.isActive } });
  revalidatePath("/admin/promo");
}

export async function deletePromoAction(id: string): Promise<void> {
  await requireAdmin();
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promo");
}

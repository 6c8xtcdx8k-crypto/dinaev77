import "server-only";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

/**
 * Промокоды: проверка кода и расчёт скидки. Скидка считается от суммы
 * товаров (subtotal), доставку не затрагивает. Всё в копейках.
 */

export type PromoInfo = {
  type: string; // PERCENT | FIXED
  value: number;
  maxDiscount: number;
};

export type PromoResult =
  | { ok: true; code: string; discount: number; label: string }
  | { ok: false; error: string };

/** Размер скидки в копейках для данной суммы товаров. */
export function promoDiscount(promo: PromoInfo, subtotal: number): number {
  let d =
    promo.type === "PERCENT" ? Math.floor((subtotal * promo.value) / 100) : promo.value;
  if (promo.type === "PERCENT" && promo.maxDiscount > 0) d = Math.min(d, promo.maxDiscount);
  // Скидка не может быть больше суммы товаров.
  return Math.max(0, Math.min(d, subtotal));
}

/** Человекочитаемая пометка промокода: «−10%» или «−500 ₽». */
export function promoLabel(promo: PromoInfo): string {
  return promo.type === "PERCENT" ? `−${promo.value}%` : `−${formatPrice(promo.value)}`;
}

/**
 * Проверяет промокод и возвращает скидку для указанной суммы товаров.
 * Используется и для предпросмотра на витрине, и при оформлении заказа.
 */
export async function validatePromo(rawCode: string, subtotal: number): Promise<PromoResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Введите промокод" };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.isActive) return { ok: false, error: "Промокод не найден или неактивен" };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Срок действия промокода истёк" };
  }
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
    return { ok: false, error: "Промокод больше не действует" };
  }
  if (subtotal < promo.minSubtotal) {
    return { ok: false, error: `Промокод действует при заказе от ${formatPrice(promo.minSubtotal)}` };
  }

  const discount = promoDiscount(promo, subtotal);
  if (discount <= 0) return { ok: false, error: "Промокод не даёт скидки на этот заказ" };

  return { ok: true, code, discount, label: promoLabel(promo) };
}

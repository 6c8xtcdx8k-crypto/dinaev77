import "server-only";
import { prisma } from "@/lib/db";

export type PromoValidation =
  | { ok: true; promo: { id: string; code: string; type: string; value: number }; discount: number }
  | { ok: false; error: string };

/**
 * Проверяет промокод и считает скидку для суммы заказа (в копейках).
 * Скидка промокода применяется к сумме товаров ПОСЛЕ товарных скидок.
 */
export async function validatePromoCode(code: string, subtotal: number): Promise<PromoValidation> {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo || !promo.isActive) return { ok: false, error: "Промокод не найден" };

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) return { ok: false, error: "Промокод ещё не действует" };
  if (promo.endsAt && promo.endsAt < now) return { ok: false, error: "Срок действия промокода истёк" };
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
    return { ok: false, error: "Лимит использований промокода исчерпан" };
  if (subtotal < promo.minOrderTotal)
    return { ok: false, error: `Промокод действует для заказов от ${Math.round(promo.minOrderTotal / 100)} ₽` };

  const discount =
    promo.type === "PERCENT"
      ? Math.round((subtotal * promo.value) / 100)
      : Math.min(promo.value, subtotal);

  return { ok: true, promo: { id: promo.id, code: promo.code, type: promo.type, value: promo.value }, discount };
}

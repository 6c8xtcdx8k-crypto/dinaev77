"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCart, getCartLines } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/services/orders";
import { validatePromoCode } from "@/services/promo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { DeliveryMethod } from "@/lib/constants";

export type CheckoutFormState = { error?: string } | undefined;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Укажите имя получателя"),
  customerEmail: z.string().email("Некорректный email"),
  customerPhone: z.string().min(10, "Укажите телефон"),
  deliveryMethod: z.enum(["CDEK"]),
  deliveryAddress: z.string().min(5, "Укажите город и адрес пункта СДЭК"),
  promoCode: z.string().optional(),
});

export async function placeOrderAction(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  // Защита от флуда заказами (и спама в чат менеджеров).
  if (!rateLimit(`order:${await getClientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: "Слишком много заказов подряд — попробуйте позже" };
  }
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    deliveryMethod: formData.get("deliveryMethod"),
    deliveryAddress: formData.get("deliveryAddress"),
    promoCode: (formData.get("promoCode") as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const cart = await getCart();
  if (!cart) return { error: "Корзина пуста" };
  const user = await getCurrentUser();

  const result = await createOrder({
    cartId: cart.id,
    userId: user?.id ?? null,
    ...parsed.data,
    deliveryMethod: parsed.data.deliveryMethod as DeliveryMethod,
  });
  if (!result.ok) return { error: result.error };

  // Оплата проходит через менеджера: сразу на страницу «заказ принят»,
  // где есть кнопка «Написать менеджеру».
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${result.orderId}`);
}

/** Проверка промокода на странице корзины/оформления (без создания заказа). */
export async function checkPromoAction(code: string): Promise<
  { ok: true; discount: number; code: string } | { ok: false; error: string }
> {
  // Защита от перебора промокодов.
  if (!rateLimit(`promo:${await getClientIp()}`, 15, 10 * 60 * 1000)) {
    return { ok: false, error: "Слишком много попыток — подождите" };
  }
  const cart = await getCart();
  if (!cart) return { ok: false, error: "Корзина пуста" };
  const lines = await getCartLines(cart.id);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const res = await validatePromoCode(code, subtotal);
  if (!res.ok) return res;
  return { ok: true, discount: res.discount, code: res.promo.code };
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/services/orders";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { DeliveryMethod } from "@/lib/constants";

export type CheckoutFormState = { error?: string } | undefined;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Укажите имя получателя"),
  customerEmail: z.string().email("Некорректный email"),
  customerPhone: z.string().min(10, "Укажите телефон"),
  deliveryMethod: z.enum(["CDEK"]),
  deliveryAddress: z.string().min(5, "Укажите город и адрес доставки"),
  deliveryCity: z.coerce.number().int().positive("Выберите город доставки"),
  promoCode: z.string().trim().max(32).optional(),
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
    deliveryCity: formData.get("deliveryCity"),
    promoCode: formData.get("promoCode") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const cart = await getCart();
  if (!cart) return { error: "Корзина пуста" };
  const user = await getCurrentUser();

  const result = await createOrder({
    cartId: cart.id,
    userId: user?.id ?? null,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
    deliveryMethod: parsed.data.deliveryMethod as DeliveryMethod,
    deliveryAddress: parsed.data.deliveryAddress,
    deliveryCity: parsed.data.deliveryCity,
    promoCode: parsed.data.promoCode,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  redirect(`/checkout/success/${result.orderId}`);
}

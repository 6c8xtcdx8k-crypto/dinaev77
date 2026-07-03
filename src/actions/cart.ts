"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateCart } from "@/lib/cart";

export type CartActionResult = { ok: boolean; error?: string };

export async function addToCartAction(variantId: string, qty = 1): Promise<CartActionResult> {
  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant) return { ok: false, error: "Вариант товара не найден" };
  if (variant.stock < 1) return { ok: false, error: "Товара нет в наличии" };

  const cart = await getOrCreateCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const newQty = Math.min((existing?.qty ?? 0) + qty, variant.stock);
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId, qty: newQty } });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout"); // счётчик в шапке
  return { ok: true };
}

export async function updateCartItemAction(itemId: string, qty: number): Promise<CartActionResult> {
  const cart = await getOrCreateCart();
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: true },
  });
  if (!item) return { ok: false, error: "Позиция не найдена" };

  if (qty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { qty: Math.min(qty, item.variant.stock) },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(itemId: string): Promise<CartActionResult> {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { ok: true };
}

import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const CART_COOKIE = "sb_cart";

/**
 * Возвращает корзину текущего посетителя (гостя или пользователя),
 * создавая её при необходимости. Гостевая корзина привязана к cookie-токену;
 * после входа она автоматически закрепляется за пользователем.
 */
export async function getOrCreateCart() {
  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;
  const user = await getCurrentUser();

  if (!token) {
    token = randomUUID();
    jar.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 180 * 24 * 60 * 60,
      path: "/",
    });
  }

  let cart = await prisma.cart.findUnique({ where: { token } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { token, userId: user?.id ?? null } });
  } else if (user && cart.userId !== user.id) {
    cart = await prisma.cart.update({ where: { id: cart.id }, data: { userId: user.id } });
  }
  return cart;
}

/** Корзина без создания — для чтения (шапка сайта, страница корзины). */
export async function getCart() {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({ where: { token } });
}

export type CartLine = {
  itemId: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: string;
  color: string;
  desiredColor: string;
  price: number; // цена продажи за единицу
  qty: number;
  stock: number;
};

export async function getCartLines(cartId: string): Promise<CartLine[]> {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: { sort: "asc" }, take: 1 } } },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return items.map((it) => ({
    itemId: it.id,
    variantId: it.variantId,
    productId: it.variant.product.id,
    slug: it.variant.product.slug,
    name: it.variant.product.name,
    imageUrl: it.variant.product.images[0]?.url ?? null,
    size: it.variant.size,
    color: it.variant.color,
    desiredColor: it.desiredColor,
    price: it.variant.product.basePrice,
    qty: it.qty,
    stock: it.variant.stock,
  }));
}

export async function getCartCount(): Promise<number> {
  const cart = await getCart();
  if (!cart) return 0;
  const agg = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { qty: true },
  });
  return agg._sum.qty ?? 0;
}

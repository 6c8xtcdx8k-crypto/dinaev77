/**
 * Сквозной smoke-тест бизнес-логики против реальной БД:
 * корзина → заказ (списание остатков) → оплата → сборка → отмена (возврат остатков).
 *
 * Запуск: NODE_OPTIONS="--conditions=react-server" npx tsx scripts/smoke-test.ts
 * (условие react-server отключает guard пакета "server-only" вне Next.js)
 */
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { createOrder, changeOrderStatus } from "@/services/orders";

let failures = 0;
function check(cond: boolean, msg: string) {
  console.log(`${cond ? "ok" : "FAIL"}: ${msg}`);
  if (!cond) failures++;
}

async function main() {
  // Подготовка: корзина с двумя позициями
  const variants = await prisma.variant.findMany({
    where: { stock: { gte: 2 } },
    take: 2,
    include: { product: true },
  });
  check(variants.length === 2, "нашлись варианты с остатком");

  const cart = await prisma.cart.create({ data: { token: randomUUID() } });
  for (const v of variants) {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId: v.id, qty: 2 } });
  }

  const stockBefore = new Map(variants.map((v) => [v.id, v.stock]));

  // Заказ
  const res = await createOrder({
    cartId: cart.id,
    userId: null,
    customerName: "Тест Тестов",
    customerEmail: "smoke@test.local",
    customerPhone: "+7 999 111-22-33",
    deliveryMethod: "CDEK",
    deliveryAddress: "г. Москва, пункт СДЭК №1",
  });
  check(res.ok, `заказ создан: ${res.ok ? `№${res.orderNumber}` : res.error}`);
  if (!res.ok) process.exit(1);

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: res.orderId },
    include: { items: true, statusHistory: true },
  });
  check(order.items.length === 2, "в заказе 2 позиции-снимка");
  check(order.total === order.subtotal + order.deliveryCost, "итог сходится");

  for (const v of variants) {
    const after = await prisma.variant.findUniqueOrThrow({ where: { id: v.id } });
    check(after.stock === stockBefore.get(v.id)! - 2, `остаток списан (${v.sku})`);
  }
  const cartLeft = await prisma.cartItem.count({ where: { cartId: cart.id } });
  check(cartLeft === 0, "корзина очищена после заказа");

  // Статусы: NEW → PAID → PROCESSING; запрещённый переход; отмена возвращает остаток
  check((await changeOrderStatus(order.id, "PAID")).ok, "NEW → PAID");
  check((await changeOrderStatus(order.id, "DELIVERED")).ok === false, "PAID → DELIVERED запрещён");
  check((await changeOrderStatus(order.id, "PROCESSING")).ok, "PAID → PROCESSING");
  check((await changeOrderStatus(order.id, "CANCELLED")).ok, "PROCESSING → CANCELLED");
  for (const v of variants) {
    const after = await prisma.variant.findUniqueOrThrow({ where: { id: v.id } });
    check(after.stock === stockBefore.get(v.id)!, `остаток возвращён при отмене (${v.sku})`);
  }

  // Превышение остатка отклоняется
  const smallVariant = variants[0];
  const cart2 = await prisma.cart.create({ data: { token: randomUUID() } });
  await prisma.cartItem.create({
    data: { cartId: cart2.id, variantId: smallVariant.id, qty: 9999 },
  });
  const res2 = await createOrder({
    cartId: cart2.id,
    userId: null,
    customerName: "Т",
    customerEmail: "smoke@test.local",
    customerPhone: "+7 999 111-22-33",
    deliveryMethod: "CDEK",
    deliveryAddress: "г. Москва, пункт СДЭК",
  });
  check(!res2.ok, "заказ сверх остатка отклонён");

  // Уборка тестовых данных
  await prisma.order.deleteMany({ where: { customerEmail: "smoke@test.local" } });
  await prisma.cart.deleteMany({ where: { id: { in: [cart.id, cart2.id] } } });

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().finally(() => prisma.$disconnect());

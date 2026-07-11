import "server-only";
import { prisma } from "@/lib/db";
import { getCartLines } from "@/lib/cart";
import { sendEmail } from "@/services/email";
import { orderCreatedEmail, orderStatusEmail } from "@/services/email/templates";
import { escapeHtml, sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";
import { getPaymentMethods, qrUrlFor } from "@/lib/payment";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  DELIVERY_METHODS,
  ORDER_STATUS_TRANSITIONS,
  type DeliveryMethod,
  type OrderStatus,
} from "@/lib/constants";

export type CheckoutInput = {
  cartId: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
};

export type CheckoutResult =
  | { ok: true; orderId: string; orderNumber: number }
  | { ok: false; error: string };

export function deliveryCostFor(method: DeliveryMethod, _subtotal: number): number {
  // Доставка СДЭК за счёт покупателя: в сумму заказа не включается,
  // тариф оплачивается при получении.
  return DELIVERY_METHODS[method]?.cost ?? 0;
}

/**
 * Создание заказа из корзины. Атомарно (в транзакции):
 * проверяет и списывает остатки, фиксирует снимки позиций,
 * очищает корзину.
 */
export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const lines = await getCartLines(input.cartId);
  if (lines.length === 0) return { ok: false, error: "Корзина пуста" };

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const deliveryCost = deliveryCostFor(input.deliveryMethod, subtotal);
  const total = subtotal + deliveryCost;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Проверяем и списываем остатки. updateMany с условием stock >= qty
      //    защищает от гонок: если товар разобрали — count будет 0.
      for (const line of lines) {
        const res = await tx.variant.updateMany({
          where: { id: line.variantId, stock: { gte: line.qty } },
          data: { stock: { decrement: line.qty } },
        });
        if (res.count === 0) {
          throw new Error(`OUT_OF_STOCK:${line.name} (${line.size}, ${line.color})`);
        }
        await tx.product.update({
          where: { id: line.productId },
          data: { salesCount: { increment: line.qty } },
        });
      }

      // 2. Создаём заказ со снимками позиций. Номер — max+1 внутри
      //    транзакции; unique-констрейнт страхует от коллизий.
      const lastNumber = await tx.order.aggregate({ _max: { number: true } });
      const created = await tx.order.create({
        data: {
          number: (lastNumber._max.number ?? 1000) + 1,
          userId: input.userId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          deliveryMethod: input.deliveryMethod,
          deliveryAddress: input.deliveryAddress,
          deliveryCost,
          subtotal,
          total,
          paymentProvider: "manual", // оплата USDT/картой, подтверждает владелец
          items: {
            create: lines.map((l) => ({
              variantId: l.variantId,
              productName: l.name,
              productSlug: l.slug,
              size: l.size,
              color: l.color,
              price: l.price,
              qty: l.qty,
            })),
          },
          statusHistory: { create: { status: "NEW", comment: "Заказ создан" } },
        },
      });

      // 4. Очищаем корзину.
      await tx.cartItem.deleteMany({ where: { cartId: input.cartId } });

      return created;
    });

    // Уведомления — вне транзакции, их сбой не откатывает заказ.
    // 1. Покупателю в Telegram: бот сам присылает реквизиты и QR для оплаты.
    if (input.userId) {
      void sendPaymentRequisites(input.userId, order.number, order.total);
    }
    // 2. Владельцу магазина: новый заказ (состав, контакты, @username).
    void notifyOrdersChat(order.id, order.number, input.userId, lines, {
      name: order.customerName,
      phone: order.customerPhone,
      total: order.total,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: order.deliveryAddress,
    });
    const tpl = orderCreatedEmail({
      number: order.number,
      customerName: order.customerName,
      total: order.total,
      items: lines.map((l) => ({
        productName: l.name,
        size: l.size,
        color: l.color,
        qty: l.qty,
        price: l.price,
      })),
    });
    void sendEmail({ to: order.customerEmail, ...tpl });

    return { ok: true, orderId: order.id, orderNumber: order.number };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("OUT_OF_STOCK:")) {
      return { ok: false, error: `Недостаточно на складе: ${msg.slice("OUT_OF_STOCK:".length)}` };
    }
    console.error("[orders] createOrder failed:", err);
    return { ok: false, error: "Не удалось оформить заказ, попробуйте ещё раз" };
  }
}

/**
 * Смена статуса заказа с валидацией перехода, записью в историю
 * и email-уведомлением покупателя. При отмене возвращает остатки.
 */
export async function changeOrderStatus(
  orderId: string,
  next: OrderStatus,
  comment = "",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Заказ не найден" };

  const allowed = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(next)) {
    return { ok: false, error: `Недопустимый переход: ${order.status} → ${next}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: next,
        paymentStatus: next === "PAID" ? "PAID" : order.paymentStatus,
        statusHistory: { create: { status: next, comment } },
      },
    });

    // Отмена — возвращаем товар на склад.
    if (next === "CANCELLED") {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.qty } },
          });
        }
      }
    }
  });

  const tpl = orderStatusEmail({ number: order.number, customerName: order.customerName }, next);
  void sendEmail({ to: order.customerEmail, ...tpl });
  if (order.userId) {
    void notifyTelegram(
      order.userId,
      `Заказ <b>№${order.number}</b>: новый статус — <b>${ORDER_STATUS_LABELS[next]}</b>.`,
    );
  }

  return { ok: true };
}

/** Дублирует уведомление в Telegram, если пользователь пришёл из Mini App. */
async function notifyTelegram(
  userId: string,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });
    if (user?.telegramId) await sendTelegramMessage(user.telegramId, text, replyMarkup);
  } catch (err) {
    console.error("[telegram] notify failed:", err);
  }
}

/**
 * Бот присылает покупателю реквизиты оплаты: приветствие, кошелёк USDT TRC-20
 * и QR-код. Работает автоматически, без участия владельца.
 */
export async function sendPaymentRequisites(
  userId: string,
  orderNumber: number,
  total: number,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, name: true },
    });
    if (!user?.telegramId) return;

    const methods = getPaymentMethods();
    const hi = `Здравствуйте, ${escapeHtml(user.name.split(" ")[0] || "друг")}! 👋`;

    if (methods.length === 0) {
      await sendTelegramMessage(
        user.telegramId,
        `${hi}\n\nВаш заказ <b>№${orderNumber}</b> на <b>${formatPrice(total)}</b> принят. ` +
          `Реквизиты для оплаты пришлём в ближайшее время.`,
      );
      return;
    }

    // Приветствие + список способов, затем по QR-коду на каждый.
    await sendTelegramMessage(
      user.telegramId,
      `${hi}\n\nВаш заказ <b>№${orderNumber}</b> на <b>${formatPrice(total)}</b> принят. 🛍\n\n` +
        `Оплатить можно одним из способов ниже. После оплаты пришлите сюда чек — ` +
        `и дождитесь подтверждения: проверю поступление и подтвержу заказ. Жду оплату 🙌`,
    );
    for (const m of methods) {
      const caption =
        `<b>${m.title}</b>\n${m.label}:\n<code>${escapeHtml(m.value)}</code>\n\n` +
        `Отсканируйте QR-код или скопируйте реквизиты.`;
      await sendTelegramPhoto(user.telegramId, qrUrlFor(m.qrData), caption);
    }
  } catch (err) {
    console.error("[telegram] payment requisites failed:", err);
  }
}

/**
 * Отправляет новый заказ в служебный чат менеджеров (env ORDERS_CHAT_ID).
 * Товара на складе нет — менеджер закупает по этому сообщению.
 */
async function notifyOrdersChat(
  orderId: string,
  orderNumber: number,
  userId: string | null,
  lines: { name: string; slug: string; size: string; color: string; qty: number; price: number }[],
  info: { name: string; phone: string; total: number; deliveryMethod: string; deliveryAddress: string },
): Promise<void> {
  const chatId = process.env.ORDERS_CHAT_ID;
  if (!chatId) return;
  try {
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { telegramUsername: true },
        })
      : null;
    const username = user?.telegramUsername ? `@${escapeHtml(user.telegramUsername)}` : "без username (гость/веб)";

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    // Название товара — ссылкой на карточку, чтобы сразу видеть, что заказали
    const items = lines
      .map((l) => {
        const name = base
          ? `<a href="${base}/product/${l.slug}">${escapeHtml(l.name)}</a>`
          : escapeHtml(l.name);
        return `• ${name} — ${escapeHtml(l.size)}, ${escapeHtml(l.color)} × ${l.qty} (${formatPrice(l.price * l.qty)})`;
      })
      .join("\n");
    const delivery = "СДЭК (за счёт покупателя)";

    await sendTelegramMessage(
      chatId,
      `🛒 <b>Новый заказ №${orderNumber}</b> — <b>${formatPrice(info.total)}</b>\n\n` +
        `${items}\n\n` +
        `Покупатель: ${escapeHtml(info.name)}, ${escapeHtml(info.phone)}\nTelegram: <b>${username}</b>\n` +
        `${delivery}: ${escapeHtml(info.deliveryAddress)}\n\n` +
        (base ? `Админка: ${base}/admin/orders/${orderId}` : ""),
    );
  } catch (err) {
    console.error("[telegram] orders-chat notify failed:", err);
  }
}

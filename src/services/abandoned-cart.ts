import "server-only";
import { prisma } from "@/lib/db";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import { formatPrice } from "@/lib/money";

/**
 * Напоминание о брошенной корзине. «Брошенной» считается корзина, в которой
 * есть товары, она привязана к пользователю с Telegram, по ней не было
 * активности дольше порога и напоминание ещё не отправлялось.
 *
 * Порог бездействия (минуты) — ABANDONED_AFTER_MIN (по умолчанию 120).
 * Слишком старые корзины (старше ABANDONED_MAX_HOURS, по умолчанию 72 ч)
 * не трогаем, чтобы не слать напоминания по давно забытым корзинам.
 */
export async function sendAbandonedCartReminders(): Promise<{ sent: number; scanned: number }> {
  const afterMin = Number(process.env.ABANDONED_AFTER_MIN) || 120;
  const maxHours = Number(process.env.ABANDONED_MAX_HOURS) || 72;
  const now = Date.now();
  const inactiveBefore = new Date(now - afterMin * 60_000);
  const notOlderThan = new Date(now - maxHours * 60 * 60_000);

  const carts = await prisma.cart.findMany({
    where: {
      remindedAt: null,
      updatedAt: { lte: inactiveBefore, gte: notOlderThan },
      user: { is: { telegramId: { not: null } } },
      items: { some: {} },
    },
    include: {
      user: { select: { telegramId: true, name: true } },
      items: {
        include: {
          variant: { include: { product: { select: { name: true, basePrice: true } } } },
        },
      },
    },
    take: 100,
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  let sent = 0;

  for (const cart of carts) {
    if (!cart.user?.telegramId || cart.items.length === 0) continue;

    // Отмечаем напоминание сразу (до отправки), чтобы при повторном запуске
    // крона не отправить дубль, даже если Telegram ответит с задержкой.
    await prisma.cart.update({ where: { id: cart.id }, data: { remindedAt: new Date() } });

    const total = cart.items.reduce((s, it) => s + it.variant.product.basePrice * it.qty, 0);
    const list = cart.items
      .slice(0, 8)
      .map((it) => {
        const q = it.qty > 1 ? ` × ${it.qty}` : "";
        return `• ${escapeHtml(it.variant.product.name)} (${escapeHtml(it.variant.size)})${q}`;
      })
      .join("\n");
    const more = cart.items.length > 8 ? `\n…и ещё ${cart.items.length - 8}` : "";
    const name = escapeHtml(cart.user.name.split(" ")[0] || "друг");

    const text =
      `${name}, вы забыли товары в корзине 🛍\n\n` +
      `${list}${more}\n\n` +
      `На сумму <b>${formatPrice(total)}</b>. Товары ещё в наличии — оформите, пока не разобрали 🙌`;

    const replyMarkup = base
      ? { inline_keyboard: [[{ text: "🛒 Открыть корзину", url: `${base}/cart` }]] }
      : undefined;

    await sendTelegramMessage(cart.user.telegramId, text, replyMarkup);
    sent++;
  }

  return { sent, scanned: carts.length };
}

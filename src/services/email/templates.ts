import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type OrderForEmail = {
  number: number;
  customerName: string;
  total: number;
  items: { productName: string; size: string; color: string; qty: number; price: number }[];
};

function layout(title: string, body: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <div style="background:#047857;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
      <strong style="font-size:18px">🍓 Styleberries</strong>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="margin-top:0">${title}</h2>
      ${body}
      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        Это автоматическое письмо магазина Styleberries — отвечать на него не нужно.
      </p>
    </div>
  </div>`;
}

function itemsTable(items: OrderForEmail["items"]): string {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6">${i.productName}<br>
            <span style="color:#6b7280;font-size:12px">Размер: ${i.size} · Цвет: ${i.color}</span></td>
          <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:center">${i.qty} шт.</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:right">${formatPrice(i.price * i.qty)}</td>
        </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`;
}

export function orderCreatedEmail(order: OrderForEmail): { subject: string; html: string } {
  return {
    subject: `Заказ №${order.number} оформлен — Styleberries`,
    html: layout(
      `Спасибо за заказ, ${order.customerName}!`,
      `<p>Мы приняли ваш заказ <strong>№${order.number}</strong> и ждём оплату.</p>
       ${itemsTable(order.items)}
       <p style="text-align:right;font-size:16px"><strong>Итого: ${formatPrice(order.total)}</strong></p>`,
    ),
  };
}

export function orderStatusEmail(
  order: Pick<OrderForEmail, "number" | "customerName">,
  status: OrderStatus,
): { subject: string; html: string } {
  const label = ORDER_STATUS_LABELS[status];
  return {
    subject: `Заказ №${order.number}: ${label} — Styleberries`,
    html: layout(
      `Статус заказа №${order.number} обновлён`,
      `<p>${order.customerName}, ваш заказ теперь в статусе: <strong>${label}</strong>.</p>
       <p>Отследить заказ можно в <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/account" style="color:#047857">личном кабинете</a>.</p>`,
    ),
  };
}

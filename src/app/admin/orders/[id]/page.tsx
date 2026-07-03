import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { DELIVERY_METHODS, ORDER_STATUS_LABELS, type DeliveryMethod, type OrderStatus } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";

export const metadata: Metadata = { title: "Заказ — админка" };
export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      promoCode: true,
      user: { select: { email: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/admin/orders" className="text-sm text-zinc-400 hover:text-brand-600">
          ← Все заказы
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Заказ №{order.number}</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-zinc-400">
          {new Date(order.createdAt).toLocaleString("ru-RU")} · оплата: {order.paymentProvider} (
          {order.paymentStatus})
        </p>
      </div>

      <section className="card p-5">
        <h3 className="mb-3 font-bold">Управление статусом</h3>
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </section>

      <section className="card p-5">
        <h3 className="mb-3 font-bold">Состав</h3>
        <ul className="divide-y divide-zinc-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2 text-sm">
              <span>
                {item.productName}{" "}
                <span className="text-zinc-400">
                  ({item.size}, {item.color}) × {item.qty}
                </span>
              </span>
              <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Товары</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>Промокод {order.promoCode?.code}</dt>
              <dd>−{formatPrice(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-500">Доставка</dt>
            <dd>{formatPrice(order.deliveryCost)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Итого</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="card p-5 text-sm">
        <h3 className="mb-2 font-bold">Покупатель и доставка</h3>
        <p>
          {order.customerName} · {order.customerPhone} · {order.customerEmail}
          {order.user ? "" : " (гость)"}
        </p>
        <p className="mt-1 text-zinc-500">
          {DELIVERY_METHODS[order.deliveryMethod as DeliveryMethod]?.label ?? order.deliveryMethod}:{" "}
          {order.deliveryAddress}
        </p>
      </section>

      <section className="card p-5">
        <h3 className="mb-3 font-bold">История</h3>
        <ol className="space-y-2 text-sm">
          {order.statusHistory.map((h) => (
            <li key={h.id} className="flex items-baseline gap-3">
              <span className="shrink-0 text-xs text-zinc-400">
                {new Date(h.createdAt).toLocaleString("ru-RU")}
              </span>
              <span className="font-medium">
                {ORDER_STATUS_LABELS[h.status as OrderStatus] ?? h.status}
              </span>
              {h.comment && <span className="text-zinc-400">— {h.comment}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

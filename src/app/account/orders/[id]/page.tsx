import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import {
  DELIVERY_METHODS,
  ORDER_STATUS_LABELS,
  type DeliveryMethod,
  type OrderStatus,
} from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = { title: "Заказ" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  return (
    <div className="container max-w-3xl py-6">
      <Link href="/account" className="text-sm text-zinc-400 hover:text-brand-600">
        ← Все заказы
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Заказ №{order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        Оформлен {new Date(order.createdAt).toLocaleString("ru-RU")}
      </p>

      {order.status === "NEW" && (
        <div className="card mt-4 border-brand-200 bg-brand-50 p-4">
          <p className="text-sm text-brand-800">
            Заказ ожидает оплаты — реквизиты и QR-коды бот отправил вам в чат.
            После оплаты пришлите туда чек.
          </p>
        </div>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-3 font-bold">Состав заказа</h2>
        <ul className="divide-y divide-zinc-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <Link href={`/product/${item.productSlug}`} className="font-medium hover:text-brand-600">
                  {item.productName}
                </Link>
                <p className="text-zinc-400">
                  {item.size} · {item.color} · {item.qty} шт.
                </p>
              </div>
              <span className="font-semibold">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Товары</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.deliveryCost > 0 && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Доставка</dt>
              <dd>{formatPrice(order.deliveryCost)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <dt>Итого</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="card mt-5 p-5">
        <h2 className="mb-2 font-bold">Доставка</h2>
        <p className="text-sm">
          {DELIVERY_METHODS[order.deliveryMethod as DeliveryMethod]?.label ?? order.deliveryMethod}
        </p>
        <p className="text-sm text-zinc-500">{order.deliveryAddress}</p>
        <p className="mt-1 text-sm text-zinc-500">
          Получатель: {order.customerName}, {order.customerPhone}
        </p>
        {order.desiredColor && (
          <p className="mt-1 text-sm text-zinc-500">
            Желаемый цвет: <span className="font-medium text-zinc-700">{order.desiredColor}</span>
          </p>
        )}
      </section>

      <section className="card mt-5 p-5">
        <h2 className="mb-3 font-bold">История статусов</h2>
        <ol className="space-y-2">
          {order.statusHistory.map((h) => (
            <li key={h.id} className="flex items-baseline gap-3 text-sm">
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

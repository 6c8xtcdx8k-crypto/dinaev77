import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import {
  ACTIVE_DELIVERY_STATUSES,
  DELIVERY_METHODS,
  ORDER_STATUS_LABELS,
  type DeliveryMethod,
  type OrderStatus,
} from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = { title: "Доставки" };
export const dynamic = "force-dynamic";

// Этапы «трека» доставки в карточке.
const TRACK: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function DeliveriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [active, delivered] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id, status: { in: [...ACTIVE_DELIVERY_STATUSES] } },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { userId: user.id, status: "DELIVERED" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { items: true },
    }),
  ]);

  return (
    <div className="container max-w-3xl py-6">
      <Link href="/account" className="text-sm text-zinc-400 hover:text-brand-600">
        ← Профиль
      </Link>
      <h1 className="mb-5 mt-1 text-2xl font-bold">Доставки</h1>

      {active.length === 0 ? (
        <div className="card p-8 text-center text-zinc-500">
          Активных доставок нет.{" "}
          <Link href="/catalog" className="font-medium text-brand-600 hover:underline">
            За покупками →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {active.map((order) => {
            const step = TRACK.indexOf(order.status as OrderStatus);
            return (
              <li key={order.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="font-bold hover:text-brand-600"
                  >
                    Заказ №{order.number}
                  </Link>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Прогресс доставки */}
                <div className="mt-3 flex items-center gap-1" aria-hidden>
                  {TRACK.map((s, i) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-500" : "bg-zinc-200"}`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  {ORDER_STATUS_LABELS[order.status as OrderStatus]} ·{" "}
                  {DELIVERY_METHODS[order.deliveryMethod as DeliveryMethod]?.label}:{" "}
                  {order.deliveryAddress}
                </p>

                <p className="mt-2 line-clamp-1 text-sm text-zinc-500">
                  {order.items.map((i) => i.productName).join(", ")}
                </p>
                <p className="mt-1 font-semibold">{formatPrice(order.total)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {delivered.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Уже доставлены</h2>
          <ul className="space-y-3">
            {delivered.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="card flex items-center justify-between gap-3 p-4 transition hover:border-brand-400"
                >
                  <div className="min-w-0">
                    <span className="font-semibold">№{order.number}</span>
                    <p className="line-clamp-1 text-sm text-zinc-500">
                      {order.items.map((i) => i.productName).join(", ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">{formatPrice(order.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

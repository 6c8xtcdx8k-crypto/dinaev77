import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = { title: "Админка" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orderCount, revenue, productCount, lowStock, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { notIn: ["NEW", "CANCELLED"] } },
      _sum: { total: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.variant.count({ where: { stock: { lte: 3 } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const stats = [
    { label: "Выручка (оплачено)", value: formatPrice(revenue._sum.total ?? 0) },
    { label: "Заказов всего", value: String(orderCount) },
    { label: "Активных товаров", value: String(productCount) },
    { label: "Вариантов с остатком ≤ 3", value: String(lowStock) },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-brand-600 hover:underline">
            Все заказы →
          </Link>
        </div>
        <div className="card divide-y divide-zinc-100">
          {recentOrders.length === 0 && (
            <p className="p-6 text-center text-sm text-zinc-400">Заказов пока нет</p>
          )}
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-3 p-4 transition hover:bg-zinc-50"
            >
              <div>
                <span className="font-semibold">№{order.number}</span>
                <span className="ml-2 text-sm text-zinc-400">
                  {new Date(order.createdAt).toLocaleString("ru-RU")} · {order.customerName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatPrice(order.total)}</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

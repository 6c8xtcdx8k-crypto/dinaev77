import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export const metadata: Metadata = { title: "Заказы — админка" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as OrderStatus) ? status : undefined;

  // Поиск: номер заказа, имя покупателя или Telegram-@username.
  const query = q?.trim().replace(/^@/, "");
  const search = query
    ? {
        OR: [
          ...(Number.isInteger(Number(query)) ? [{ number: Number(query) }] : []),
          { customerName: { contains: query } },
          { customerPhone: { contains: query } },
          { user: { is: { telegramUsername: { contains: query } } } },
        ],
      }
    : undefined;

  const orders = await prisma.order.findMany({
    where: { ...(filter ? { status: filter } : {}), ...(search ?? {}) },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { qty: true } },
      user: { select: { telegramUsername: true } },
    },
  });

  return (
    <div>
      <form className="mb-3 flex max-w-md gap-2" action="/admin/orders">
        {filter && <input type="hidden" name="status" value={filter} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Поиск: @username, номер заказа, имя, телефон"
          className="input !py-2 text-sm"
        />
        <button type="submit" className="btn-secondary shrink-0 !py-2 text-sm">
          Найти
        </button>
      </form>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 text-lg font-bold">Заказы ({orders.length})</h2>
        <Link
          href="/admin/orders"
          className={`badge ${!filter ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
        >
          Все
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`badge ${filter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="p-3">Заказ</th>
              <th className="p-3">Дата</th>
              <th className="p-3">Покупатель</th>
              <th className="p-3">Telegram</th>
              <th className="p-3">Позиции</th>
              <th className="p-3">Сумма</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-zinc-400">
                  Заказов нет
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="transition hover:bg-zinc-50">
                <td className="p-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold hover:text-brand-600">
                    №{order.number}
                  </Link>
                </td>
                <td className="p-3 text-zinc-500">
                  {new Date(order.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="p-3">{order.customerName}</td>
                <td className="p-3">
                  {order.user?.telegramUsername ? (
                    <a
                      href={`https://t.me/${order.user.telegramUsername}`}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-sky-600 hover:underline"
                    >
                      @{order.user.telegramUsername}
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="p-3 text-zinc-500">
                  {order.items.reduce((s, i) => s + i.qty, 0)} шт.
                </td>
                <td className="p-3 font-medium">{formatPrice(order.total)}</td>
                <td className="p-3">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

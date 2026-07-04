import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/lib/constants";
import { ReturnStatusControl } from "@/components/admin/ReturnStatusControl";

export const metadata: Metadata = { title: "Возвраты — админка" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<ReturnStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-brand-100 text-brand-800",
};

export default async function AdminReturnsPage() {
  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      orderItem: { include: { order: { select: { id: true, number: true, customerName: true } } } },
    },
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Возвраты ({returns.length})</h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="p-3">Товар</th>
              <th className="p-3">Заказ</th>
              <th className="p-3">Причина</th>
              <th className="p-3">Сумма</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {returns.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-400">
                  Заявок на возврат нет
                </td>
              </tr>
            )}
            {returns.map((r) => (
              <tr key={r.id}>
                <td className="p-3">
                  <div className="font-medium">{r.orderItem.productName}</div>
                  <div className="text-xs text-zinc-400">
                    {r.orderItem.size} · {r.orderItem.color} · {r.orderItem.qty} шт.
                  </div>
                </td>
                <td className="p-3">
                  <Link href={`/admin/orders/${r.orderItem.order.id}`} className="font-semibold hover:text-brand-600">
                    №{r.orderItem.order.number}
                  </Link>
                  <div className="text-xs text-zinc-400">{r.orderItem.order.customerName}</div>
                </td>
                <td className="p-3 text-zinc-500">{r.reason}</td>
                <td className="p-3 font-medium">{formatPrice(r.orderItem.price * r.orderItem.qty)}</td>
                <td className="p-3">
                  <span className={`badge ${STATUS_COLORS[r.status as ReturnStatus] ?? "bg-zinc-100"}`}>
                    {RETURN_STATUS_LABELS[r.status as ReturnStatus] ?? r.status}
                  </span>
                </td>
                <td className="p-3">
                  <ReturnStatusControl returnId={r.id} currentStatus={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        При статусе «Деньги возвращены» остаток товара автоматически возвращается на склад,
        покупатель получает уведомление на email и в Telegram.
      </p>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "Возвраты" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<ReturnStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-brand-100 text-brand-800",
};

export default async function ReturnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const returns = await prisma.returnRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { orderItem: { include: { order: { select: { id: true, number: true } } } } },
  });

  return (
    <div className="container max-w-3xl py-6">
      <Link href="/account" className="text-sm text-zinc-400 hover:text-brand-600">
        ← Профиль
      </Link>
      <h1 className="mb-5 mt-1 text-2xl font-bold">Возвраты</h1>

      {returns.length === 0 ? (
        <div className="card p-8 text-center text-sm text-zinc-500">
          <p className="font-semibold text-zinc-700">Возвратов нет</p>
          <p className="mt-1">
            Оформить возврат можно на странице доставленного заказа — кнопка есть у каждой позиции.
          </p>
          <Link href="/account/deliveries" className="mt-3 inline-block font-medium text-brand-600 hover:underline">
            Мои доставки →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {returns.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.orderItem.productName}</span>
                <span className={`badge ${STATUS_COLORS[r.status as ReturnStatus] ?? "bg-zinc-100 text-zinc-600"}`}>
                  {RETURN_STATUS_LABELS[r.status as ReturnStatus] ?? r.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {r.orderItem.size} · {r.orderItem.color} · {r.orderItem.qty} шт. ·{" "}
                {formatPrice(r.orderItem.price * r.orderItem.qty)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Причина: {r.reason}</p>
              <p className="mt-1 text-xs text-zinc-400">
                Заказ{" "}
                <Link href={`/account/orders/${r.orderItem.order.id}`} className="text-brand-600 hover:underline">
                  №{r.orderItem.order.number}
                </Link>{" "}
                · заявка от {new Date(r.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { getPaymentInfo, qrUrlFor } from "@/lib/payment";
import { IconCheckCircle } from "@/components/ui/icons";
import { CopyButton } from "@/components/checkout/CopyButton";

export const metadata: Metadata = { title: "Заказ оформлен" };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) notFound();

  const pay = getPaymentInfo();

  return (
    <div className="container max-w-lg py-16 text-center">
      <IconCheckCircle className="!text-brand-500" />
      <h1 className="mt-4 text-2xl font-bold">Заказ принят!</h1>
      <p className="mt-2 text-zinc-500">
        Заказ <strong>№{order.number}</strong> на сумму{" "}
        <strong>{formatPrice(order.total)}</strong> оформлен.
      </p>

      {/* Оплата USDT TRC-20 + QR */}
      {pay.configured ? (
        <div className="card mt-6 p-5 text-left">
          <p className="text-center text-sm font-semibold text-brand-800">Оплата — USDT (сеть TRC-20)</p>
          <div className="mt-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrlFor(pay.usdtTrc20, "")}
              alt="QR-код кошелька для оплаты"
              className="h-44 w-44 rounded-xl border border-sky-100"
            />
          </div>
          <p className="mt-3 text-center text-xs text-zinc-500">Кошелёк USDT TRC-20:</p>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-sky-50 p-2">
            <code className="flex-1 break-all text-xs text-zinc-700">{pay.usdtTrc20}</code>
            <CopyButton text={pay.usdtTrc20} />
          </div>
          <p className="mt-3 text-center text-sm text-zinc-500">
            Отсканируйте QR или скопируйте адрес. После оплаты пришлите скриншот боту —
            заказ подтвердят.
          </p>
        </div>
      ) : (
        <div className="card mt-6 border-brand-200 bg-brand-50 p-5">
          <p className="text-sm font-semibold text-brand-800">Как оплатить</p>
          <p className="mt-1 text-sm text-brand-800/80">
            Реквизиты для оплаты придут в чат с ботом Styleberries.
          </p>
        </div>
      )}

      <div className="card mt-5 p-5 text-left">
        <h2 className="mb-3 font-bold">Состав заказа</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
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
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/account" className="btn-secondary">Мои заказы</Link>
        <Link href="/catalog" className="btn-secondary">Продолжить покупки</Link>
      </div>
    </div>
  );
}

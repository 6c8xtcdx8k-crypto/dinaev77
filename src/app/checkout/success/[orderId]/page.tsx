import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { IconCheckCircle } from "@/components/ui/icons";

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

  return (
    <div className="container max-w-lg py-16 text-center">
      <IconCheckCircle className="!text-brand-500" />
      <h1 className="mt-4 text-2xl font-bold">Спасибо за заказ!</h1>
      <p className="mt-2 text-zinc-500">
        Заказ <strong>№{order.number}</strong> на сумму{" "}
        <strong>{formatPrice(order.total)}</strong> оплачен и передан в сборку.
        Мы отправили подтверждение на {order.customerEmail}.
      </p>

      <div className="card mt-6 p-5 text-left">
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
        <Link href="/account" className="btn-primary">Мои заказы</Link>
        <Link href="/catalog" className="btn-secondary">Продолжить покупки</Link>
      </div>
    </div>
  );
}

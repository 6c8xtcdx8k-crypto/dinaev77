import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { confirmMockPaymentAction, cancelMockPaymentAction } from "@/actions/payment";
import { IconCard } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Оплата заказа" };
export const dynamic = "force-dynamic";

/**
 * Демонстрационная страница оплаты (mock-провайдер).
 * В продакшене вместо неё покупатель уходит на страницу реального
 * платёжного шлюза (ЮKassa, Stripe…), а статус приходит в webhook.
 */
export default async function MockPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) notFound();

  if (order.status !== "NEW") {
    return (
      <div className="container max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">Заказ №{order.number}</h1>
        <p className="mt-2 text-zinc-500">Оплата по этому заказу уже обработана.</p>
        <a href="/account" className="btn-primary mt-6">В личный кабинет</a>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-16">
      <div className="card p-8 text-center">
        <IconCard size={48} />
        <h1 className="mt-3 text-xl font-bold">Тестовая оплата</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Заказ №{order.number} · {formatPrice(order.total)}
        </p>
        <p className="mt-3 rounded-lg bg-sky-100 p-3 text-xs text-sky-800">
          Это демонстрационный платёжный шлюз. В продакшене здесь будет страница
          реального провайдера (ЮKassa, Stripe и т.п.).
        </p>
        <form action={confirmMockPaymentAction.bind(null, order.id)} className="mt-5">
          <button type="submit" className="btn-primary w-full !py-3">
            Оплатить {formatPrice(order.total)}
          </button>
        </form>
        <form action={cancelMockPaymentAction.bind(null, order.id)} className="mt-2">
          <button type="submit" className="w-full text-sm text-zinc-400 underline hover:text-red-600">
            Отменить оплату
          </button>
        </form>
      </div>
    </div>
  );
}

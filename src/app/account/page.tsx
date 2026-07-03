import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Личный кабинет" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">Личный кабинет</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-4 text-lg font-bold">
            Мои заказы <span className="text-zinc-400">({orders.length})</span>
          </h2>
          {orders.length === 0 ? (
            <div className="card p-8 text-center text-zinc-500">
              Заказов пока нет.{" "}
              <Link href="/catalog" className="font-medium text-brand-600 hover:underline">
                Выбрать товары →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="card block p-4 transition hover:border-brand-400"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">Заказ №{order.number}</span>
                        <span className="ml-2 text-sm text-zinc-400">
                          {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                      {order.items.map((i) => i.productName).join(", ")}
                    </p>
                    <p className="mt-1 font-semibold">{formatPrice(order.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <ProfileForm user={user} />
        </aside>
      </div>
    </div>
  );
}

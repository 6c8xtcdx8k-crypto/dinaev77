import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Личный кабинет" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orders, deliveryCount, returnCount, viewedCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 20,
    }),
    prisma.order.count({
      where: { userId: user.id, status: { in: [...ACTIVE_DELIVERY_STATUSES] } },
    }),
    prisma.returnRequest.count({ where: { userId: user.id } }),
    prisma.viewedProduct.count({ where: { userId: user.id } }),
  ]);

  const tiles = [
    { href: "/account/deliveries", label: "Доставки", count: deliveryCount, icon: <TruckIcon /> },
    { href: "/account/returns", label: "Возвраты", count: returnCount, icon: <ReturnIcon /> },
    { href: "/account/viewed", label: "Просмотренные", count: viewedCount, icon: <EyeIcon /> },
  ];

  return (
    <div className="container py-6">
      <h1 className="mb-5 text-2xl font-bold">Профиль</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Плитки разделов */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {tiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="card card-lift shine group flex flex-col items-center gap-1.5 p-4 text-center"
              >
                <span className="text-brand-600 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                  {tile.icon}
                </span>
                <span className="text-sm font-semibold leading-tight">{tile.label}</span>
                <span className="text-xs text-zinc-400">{tile.count}</span>
              </Link>
            ))}
          </div>

          <section>
            <h2 className="mb-3 text-lg font-bold">
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
                      className="card card-lift block p-4"
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
        </div>

        <aside>
          <ProfileForm user={user} />
        </aside>
      </div>
    </div>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function TruckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke}>
      <path d="M3 7H14V16H3V7Z" />
      <path d="M14 10H18L21 13V16H14V10Z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}
function ReturnIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke}>
      <path d="M9 14L4 9L9 4" />
      <path d="M4 9H15C18 9 20 11 20 14C20 17 18 19 15 19H8" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke}>
      <path d="M2 12C4.5 7 8 4.5 12 4.5C16 4.5 19.5 7 22 12C19.5 17 16 19.5 12 19.5C8 19.5 4.5 17 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

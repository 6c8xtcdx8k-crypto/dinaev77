import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { PromoForm } from "@/components/admin/PromoForm";
import { togglePromoAction } from "@/actions/admin";

export const metadata: Metadata = { title: "Промокоды — админка" };
export const dynamic = "force-dynamic";

export default async function AdminPromoPage() {
  const promos = await prisma.promoCode.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="max-w-3xl space-y-5">
      <PromoForm />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="p-3">Код</th>
              <th className="p-3">Скидка</th>
              <th className="p-3">Мин. заказ</th>
              <th className="p-3">Использован</th>
              <th className="p-3">До</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {promos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-400">
                  Промокодов пока нет
                </td>
              </tr>
            )}
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-mono font-semibold">{p.code}</td>
                <td className="p-3">{p.type === "PERCENT" ? `${p.value}%` : formatPrice(p.value)}</td>
                <td className="p-3 text-zinc-500">
                  {p.minOrderTotal > 0 ? formatPrice(p.minOrderTotal) : "—"}
                </td>
                <td className="p-3 text-zinc-500">
                  {p.usedCount}
                  {p.usageLimit !== null ? ` / ${p.usageLimit}` : ""}
                </td>
                <td className="p-3 text-zinc-500">
                  {p.endsAt ? new Date(p.endsAt).toLocaleDateString("ru-RU") : "бессрочно"}
                </td>
                <td className="p-3">
                  <form action={togglePromoAction.bind(null, p.id)}>
                    <button
                      type="submit"
                      className={`badge ${p.isActive ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-500"}`}
                    >
                      {p.isActive ? "Активен · выключить" : "Выключен · включить"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

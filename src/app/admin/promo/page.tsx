import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PromoManager, type PromoRow } from "@/components/admin/PromoManager";

export const metadata: Metadata = { title: "Промокоды — админка" };
export const dynamic = "force-dynamic";

export default async function AdminPromoPage() {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  const rows: PromoRow[] = promos.map((p) => ({
    id: p.id,
    code: p.code,
    type: p.type,
    value: p.value,
    minSubtotal: p.minSubtotal,
    maxDiscount: p.maxDiscount,
    usageLimit: p.usageLimit,
    usedCount: p.usedCount,
    isActive: p.isActive,
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
  }));

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold">Промокоды</h2>
        <p className="text-sm text-zinc-400">
          Скидка применяется к сумме товаров (доставка не затрагивается).
        </p>
      </div>
      <PromoManager promos={rows} />
    </div>
  );
}

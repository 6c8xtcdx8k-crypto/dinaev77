"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createPromoAction,
  togglePromoAction,
  deletePromoAction,
  type PromoFormState,
} from "@/actions/promo";
import { formatPrice } from "@/lib/money";

export type PromoRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
};

export function PromoManager({ promos }: { promos: PromoRow[] }) {
  const [state, formAction, pending] = useActionState<PromoFormState, FormData>(
    createPromoAction,
    undefined,
  );
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");

  return (
    <div className="space-y-6">
      {/* Форма создания */}
      <section className="card p-5">
        <h3 className="mb-3 font-bold">Новый промокод</h3>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <input
            name="code"
            placeholder="КОД (например SALE10)"
            required
            className="input uppercase sm:col-span-2"
            autoComplete="off"
          />
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">Тип скидки</span>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
              className="input"
            >
              <option value="PERCENT">Процент (%)</option>
              <option value="FIXED">Фиксированная (₽)</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">
              {type === "PERCENT" ? "Скидка, %" : "Скидка, ₽"}
            </span>
            <input name="value" type="number" min="1" required className="input" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">Мин. сумма заказа, ₽</span>
            <input name="minSubtotalRub" type="number" min="0" defaultValue="0" className="input" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">
              Макс. скидка, ₽ {type === "PERCENT" ? "(0 = без потолка)" : "(не нужно)"}
            </span>
            <input
              name="maxDiscountRub"
              type="number"
              min="0"
              defaultValue="0"
              disabled={type === "FIXED"}
              className="input disabled:opacity-50"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">Лимит использований (0 = без лимита)</span>
            <input name="usageLimit" type="number" min="0" defaultValue="0" className="input" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">Действует до (необязательно)</span>
            <input name="expiresAt" type="date" className="input" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className="btn-primary !py-2 text-sm">
              {pending ? "Создаём…" : "Создать промокод"}
            </button>
            {state?.error && (
              <span className="ml-3 text-sm font-medium text-red-600">{state.error}</span>
            )}
            {state?.success && (
              <span className="ml-3 text-sm font-medium text-emerald-600">{state.success}</span>
            )}
          </div>
        </form>
      </section>

      {/* Список */}
      <section className="card p-5">
        <h3 className="mb-3 font-bold">Промокоды ({promos.length})</h3>
        {promos.length === 0 ? (
          <p className="text-sm text-zinc-400">Пока нет промокодов.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400">
                  <th className="py-2 pr-3">Код</th>
                  <th className="py-2 pr-3">Скидка</th>
                  <th className="py-2 pr-3">Условия</th>
                  <th className="py-2 pr-3">Исп.</th>
                  <th className="py-2 pr-3">До</th>
                  <th className="py-2 pr-3">Статус</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <PromoRowView key={p.id} promo={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PromoRowView({ promo: p }: { promo: PromoRow }) {
  const [pending, startTransition] = useTransition();

  const discount = p.type === "PERCENT" ? `−${p.value}%` : `−${formatPrice(p.value)}`;
  const conditions = [
    p.minSubtotal > 0 ? `от ${formatPrice(p.minSubtotal)}` : null,
    p.type === "PERCENT" && p.maxDiscount > 0 ? `макс. ${formatPrice(p.maxDiscount)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <tr className="border-t border-zinc-100">
      <td className="py-2 pr-3 font-mono font-semibold">{p.code}</td>
      <td className="py-2 pr-3">{discount}</td>
      <td className="py-2 pr-3 text-zinc-500">{conditions || "—"}</td>
      <td className="py-2 pr-3 text-zinc-500">
        {p.usedCount}
        {p.usageLimit > 0 ? ` / ${p.usageLimit}` : ""}
      </td>
      <td className="py-2 pr-3 text-zinc-500">
        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("ru-RU") : "—"}
      </td>
      <td className="py-2 pr-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => togglePromoAction(p.id))}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {p.isActive ? "Активен" : "Выключен"}
        </button>
      </td>
      <td className="py-2 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Удалить промокод ${p.code}?`)) {
              startTransition(() => deletePromoAction(p.id));
            }
          }}
          className="text-xs font-medium text-zinc-400 hover:text-red-600"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}

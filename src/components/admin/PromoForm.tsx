"use client";

import { useActionState } from "react";
import { createPromoAction, type AdminFormState } from "@/actions/admin";

export function PromoForm() {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    createPromoAction,
    undefined,
  );

  return (
    <form action={formAction} className="card space-y-3 p-5">
      <h3 className="font-bold">Новый промокод</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="code" placeholder="Код (BERRY10)" required className="input uppercase" />
        <select name="type" className="input">
          <option value="PERCENT">Скидка в %</option>
          <option value="FIXED">Скидка в ₽</option>
        </select>
        <input name="value" type="number" min="1" placeholder="Размер скидки" required className="input" />
        <input name="minOrderRub" type="number" min="0" placeholder="Мин. сумма заказа, ₽" className="input" />
        <input name="usageLimit" type="number" min="0" placeholder="Лимит использований (0 = ∞)" className="input" />
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-zinc-500">Действует до</span>
          <input name="endsAt" type="date" className="input" />
        </label>
      </div>
      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm font-medium text-brand-700">✓ Промокод создан</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Создаём…" : "Создать промокод"}
      </button>
    </form>
  );
}

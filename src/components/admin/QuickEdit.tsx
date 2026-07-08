"use client";

import { useState, useTransition } from "react";
import { updateProductPriceAction, toggleProductActiveAction } from "@/actions/admin";

/** Быстрое изменение цены прямо в таблице товаров (сохраняется по Enter/уходу из поля). */
export function QuickPrice({ productId, priceRub }: { productId: string; priceRub: number }) {
  const [value, setValue] = useState(String(priceRub));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    const next = parseFloat(value);
    if (!Number.isFinite(next) || next <= 0 || next === priceRub) return;
    startTransition(async () => {
      const res = await updateProductPriceAction(productId, next);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="input w-24 !px-2 !py-1 text-sm"
        aria-label="Цена, ₽"
      />
      <span className="text-xs text-zinc-400">₽</span>
      {saved && <span className="animate-fade-up text-xs font-bold text-brand-600">✓</span>}
    </span>
  );
}

/** Тумблер «показан/скрыт» в таблице товаров. */
export function ActiveToggle({ productId, isActive }: { productId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleProductActiveAction(productId))}
      className={`badge transition-all duration-300 ${
        isActive
          ? "bg-brand-100 text-brand-800 hover:bg-brand-200"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      } ${pending ? "opacity-50" : ""}`}
      title={isActive ? "Нажмите, чтобы скрыть с сайта" : "Нажмите, чтобы показать на сайте"}
    >
      {isActive ? "На сайте" : "Скрыт"}
    </button>
  );
}

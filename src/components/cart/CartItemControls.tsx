"use client";

import { useTransition } from "react";
import { updateCartItemAction, removeCartItemAction } from "@/actions/cart";

export function CartItemControls({
  itemId,
  qty,
  maxQty,
}: {
  itemId: string;
  qty: number;
  maxQty: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-xl border border-zinc-300">
        <button
          type="button"
          aria-label="Уменьшить количество"
          disabled={pending}
          onClick={() => startTransition(() => updateCartItemAction(itemId, qty - 1).then(() => {}))}
          className="px-3 py-1.5 text-lg text-zinc-600 transition hover:text-brand-600 disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
        <button
          type="button"
          aria-label="Увеличить количество"
          disabled={pending || qty >= maxQty}
          onClick={() => startTransition(() => updateCartItemAction(itemId, qty + 1).then(() => {}))}
          className="px-3 py-1.5 text-lg text-zinc-600 transition hover:text-brand-600 disabled:opacity-40"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeCartItemAction(itemId).then(() => {}))}
        className="text-sm text-zinc-400 underline transition hover:text-red-600"
      >
        Удалить
      </button>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { placeOrderAction, type CheckoutFormState } from "@/actions/checkout";
import { formatPrice } from "@/lib/money";

export function CheckoutForm({
  subtotal,
  defaults,
}: {
  subtotal: number;
  defaults: { name: string; email: string; phone: string };
}) {
  const [state, formAction, pending] = useActionState<CheckoutFormState, FormData>(
    placeOrderAction,
    undefined,
  );

  const total = subtotal;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Получатель</h2>
          <input name="customerName" defaultValue={defaults.name} placeholder="Имя и фамилия" required className="input" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="customerEmail" type="email" defaultValue={defaults.email} placeholder="Email" required className="input" />
            <input name="customerPhone" type="tel" defaultValue={defaults.phone} placeholder="Телефон" required className="input" />
          </div>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Доставка</h2>
          <input type="hidden" name="deliveryMethod" value="CDEK" />
          <div className="flex items-center gap-3 rounded-xl border border-brand-300 bg-brand-50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-black text-brand-600 shadow-card">
              С
            </span>
            <span className="flex-1">
              <span className="block font-bold">СДЭК — пункт выдачи</span>
              <span className="text-sm text-zinc-500">
                Доставка по всей России до ближайшего пункта выдачи
              </span>
            </span>
          </div>
          <input
            name="deliveryAddress"
            placeholder="Город и адрес пункта выдачи СДЭК"
            required
            className="input"
          />
          <p className="text-xs text-zinc-400">
            Ближайший пункт можно посмотреть на cdek.ru — впишите его адрес.
          </p>
        </section>
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Ваш заказ</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Товары</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold">
            <dt>Итого</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>

        {state?.error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary mt-4 w-full !py-3">
          {pending ? "Оформляем…" : "Оформить заказ"}
        </button>
      </aside>
    </form>
  );
}

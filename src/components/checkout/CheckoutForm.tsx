"use client";

import { useActionState, useCallback, useState } from "react";
import { placeOrderAction, type CheckoutFormState } from "@/actions/checkout";
import { formatPrice } from "@/lib/money";
import { CdekDelivery } from "./CdekDelivery";

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
  const [deliveryCost, setDeliveryCost] = useState(0);
  const onCost = useCallback((k: number) => setDeliveryCost(k), []);

  const total = subtotal + deliveryCost;

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

        <input type="hidden" name="deliveryMethod" value="CDEK" />
        <CdekDelivery onCost={onCost} />
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Ваш заказ</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Товары</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Доставка СДЭК</dt>
            <dd>{deliveryCost > 0 ? formatPrice(deliveryCost) : "—"}</dd>
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
        <p className="mt-2 text-center text-xs text-zinc-400">
          Стоимость доставки рассчитывается СДЭК и добавляется к заказу
        </p>
      </aside>
    </form>
  );
}

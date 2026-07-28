"use client";

import { useActionState, useCallback, useState } from "react";
import { placeOrderAction, type CheckoutFormState } from "@/actions/checkout";
import { formatPrice } from "@/lib/money";
import { FREE_DELIVERY_FROM } from "@/lib/constants";
import { CdekDelivery } from "./CdekDelivery";
import { PromoField } from "./PromoField";

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
  const [discount, setDiscount] = useState(0);
  const onPromo = useCallback((d: number) => setDiscount(d), []);
  const clearPromo = useCallback(() => setDiscount(0), []);

  const freeDelivery = subtotal >= FREE_DELIVERY_FROM;
  const effectiveDelivery = freeDelivery ? 0 : deliveryCost;
  // Скидка не может превышать сумму товаров.
  const appliedDiscount = Math.min(discount, subtotal);
  const total = subtotal - appliedDiscount + effectiveDelivery;
  const toFree = FREE_DELIVERY_FROM - subtotal;

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
        <CdekDelivery onCost={onCost} free={freeDelivery} />
        <PromoField onApply={onPromo} onClear={clearPromo} />
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Ваш заказ</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Товары</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {appliedDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>Скидка по промокоду</dt>
              <dd>−{formatPrice(appliedDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-500">Доставка СДЭК</dt>
            <dd>
              {freeDelivery ? (
                <span className="font-semibold text-emerald-600">Бесплатно</span>
              ) : deliveryCost > 0 ? (
                formatPrice(deliveryCost)
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold">
            <dt>Итого</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>

        {!freeDelivery && toFree > 0 && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-center text-xs font-medium text-emerald-700">
            Добавьте товаров на {formatPrice(toFree)} — и доставка бесплатно 🎁
          </p>
        )}

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

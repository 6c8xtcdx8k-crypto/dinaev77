"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { placeOrderAction, checkPromoAction, type CheckoutFormState } from "@/actions/checkout";
import { formatPrice } from "@/lib/money";

const DELIVERY = {
  COURIER: { label: "Курьером до двери", hint: "399 ₽, бесплатно от 5 000 ₽", cost: 39900, freeFrom: 500000 },
  PICKUP: { label: "Пункт выдачи Styleberries", hint: "Бесплатно, 2–4 дня", cost: 0, freeFrom: 0 },
} as const;

type DeliveryKey = keyof typeof DELIVERY;

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
  const [method, setMethod] = useState<DeliveryKey>("PICKUP");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, startPromoCheck] = useTransition();

  const discount = promo?.discount ?? 0;
  const deliveryCost = useMemo(() => {
    const cfg = DELIVERY[method];
    if (cfg.freeFrom > 0 && subtotal - discount >= cfg.freeFrom) return 0;
    return cfg.cost;
  }, [method, subtotal, discount]);
  const total = subtotal - discount + deliveryCost;

  function applyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    setPromoError(null);
    startPromoCheck(async () => {
      const res = await checkPromoAction(code);
      if (res.ok) {
        setPromo({ code: res.code, discount: res.discount });
      } else {
        setPromo(null);
        setPromoError(res.error);
      }
    });
  }

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
          {(Object.entries(DELIVERY) as [DeliveryKey, (typeof DELIVERY)[DeliveryKey]][]).map(
            ([key, cfg]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  method === key ? "border-brand-600 bg-brand-50" : "border-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={key}
                  checked={method === key}
                  onChange={() => setMethod(key)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="flex-1">
                  <span className="block font-medium">{cfg.label}</span>
                  <span className="text-sm text-zinc-500">{cfg.hint}</span>
                </span>
              </label>
            ),
          )}
          <input
            name="deliveryAddress"
            placeholder={method === "COURIER" ? "Город, улица, дом, квартира" : "Город и адрес пункта выдачи"}
            required
            className="input"
          />
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Промокод</h2>
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Например, BERRY10"
              className="input uppercase"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={checkingPromo}
              className="btn-secondary shrink-0"
            >
              {checkingPromo ? "…" : "Применить"}
            </button>
          </div>
          <input type="hidden" name="promoCode" value={promo?.code ?? ""} />
          {promo && (
            <p className="text-sm font-medium text-brand-700">
              ✓ Промокод {promo.code}: скидка {formatPrice(promo.discount)}
            </p>
          )}
          {promoError && <p className="text-sm font-medium text-red-600">{promoError}</p>}
        </section>
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Ваш заказ</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Товары</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>Промокод</dt>
              <dd>−{formatPrice(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-500">Доставка</dt>
            <dd>{deliveryCost === 0 ? "Бесплатно" : formatPrice(deliveryCost)}</dd>
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
          После оформления менеджер пришлёт реквизиты для оплаты
          (карта или криптовалюта).
        </p>
      </aside>
    </form>
  );
}

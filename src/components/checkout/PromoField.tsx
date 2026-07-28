"use client";

import { useState, useTransition } from "react";
import { previewPromoAction } from "@/actions/promo";

/**
 * Поле промокода на оформлении заказа. Проверяет код на сервере (по текущей
 * корзине) и сообщает применённую скидку родителю. Окончательный размер
 * скидки всё равно пересчитывается на сервере при создании заказа.
 */
export function PromoField({
  onApply,
  onClear,
}: {
  onApply: (discount: number, code: string) => void;
  onClear: () => void;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function apply() {
    const value = code.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await previewPromoAction(value);
      if (res.ok) {
        setApplied(res.code);
        setMsg({ ok: true, text: `Промокод ${res.code} применён (${res.label})` });
        onApply(res.discount, res.code);
      } else {
        setApplied(null);
        setMsg({ ok: false, text: res.error });
        onClear();
      }
    });
  }

  function reset() {
    setApplied(null);
    setCode("");
    setMsg(null);
    onClear();
  }

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">Промокод</h2>
      {/* Применённый код уезжает в заказ; сервер проверит его повторно. */}
      <input type="hidden" name="promoCode" value={applied ?? ""} />

      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-700">
            Применён: {applied}
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-zinc-500 hover:text-red-600"
          >
            Убрать
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            placeholder="Введите промокод"
            className="input flex-1 uppercase"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={apply}
            disabled={pending || !code.trim()}
            className="btn-secondary !py-2 text-sm"
          >
            {pending ? "…" : "Применить"}
          </button>
        </div>
      )}

      {msg && (
        <p
          className={`text-sm font-medium ${msg.ok ? "text-emerald-600" : "text-red-600"}`}
        >
          {msg.text}
        </p>
      )}
    </section>
  );
}

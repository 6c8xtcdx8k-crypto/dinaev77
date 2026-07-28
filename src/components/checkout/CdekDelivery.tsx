"use client";

import { useState } from "react";
import { DELIVERY_ZONES } from "@/lib/constants";
import { formatPrice } from "@/lib/money";

/**
 * Доставка СДЭК: покупатель выбирает регион (зону) и вписывает адрес пункта
 * выдачи. Стоимость по зоне добавляется к заказу. Итоговая сумма
 * пересчитывается на сервере. Когда подключат CDEK API — цены станут точными.
 */
export function CdekDelivery({ onCost }: { onCost: (kopecks: number) => void }) {
  const [zone, setZone] = useState("");
  const selected = DELIVERY_ZONES.find((z) => z.id === zone);

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">Доставка СДЭК</h2>
      <p className="text-sm text-zinc-500">
        Доставка по всей России до пункта выдачи СДЭК. Стоимость зависит от региона.
      </p>

      <select
        value={zone}
        onChange={(e) => {
          setZone(e.target.value);
          const z = DELIVERY_ZONES.find((x) => x.id === e.target.value);
          onCost(z?.cost ?? 0);
        }}
        required
        className="input"
      >
        <option value="">Выберите регион доставки</option>
        {DELIVERY_ZONES.map((z) => (
          <option key={z.id} value={z.id}>
            {z.label} — {formatPrice(z.cost)}
          </option>
        ))}
      </select>

      <textarea
        name="deliveryAddress"
        placeholder="Город и адрес пункта выдачи СДЭК (или адрес доставки)"
        required
        rows={2}
        className="input resize-none"
      />
      <p className="text-xs text-zinc-400">
        Ближайший пункт можно найти на cdek.ru — впишите его адрес.
      </p>

      {selected && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-700">Доставка СДЭК</span>
          <span className="font-bold text-brand-700">{formatPrice(selected.cost)}</span>
        </div>
      )}

      <input type="hidden" name="deliveryZone" value={zone} />
    </section>
  );
}

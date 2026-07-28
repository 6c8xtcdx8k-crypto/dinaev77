"use client";

import { useEffect, useRef, useState } from "react";
import { DELIVERY_ZONES } from "@/lib/constants";
import { formatPrice } from "@/lib/money";

type City = { code: number; city: string; zone: string };
type Point = { code: string; address: string; work: string };

const zoneCost = (z: string) => DELIVERY_ZONES.find((x) => x.id === z)?.cost ?? 0;

/**
 * Доставка CDEK: покупатель вводит город → подсказка городов → выбор ближайшего
 * пункта выдачи (из публичного списка CDEK). Стоимость определяется по зоне
 * города и добавляется к заказу. Работает без API-ключей CDEK.
 */
export function CdekDelivery({ onCost }: { onCost: (kopecks: number) => void }) {
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [loadingPts, setLoadingPts] = useState(false);
  const [address, setAddress] = useState("");
  const deb = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Автоподсказка городов
  useEffect(() => {
    if (city && q === city.city) return;
    clearTimeout(deb.current);
    if (q.trim().length < 2) {
      setSugs([]);
      return;
    }
    deb.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/cdek/cities?q=${encodeURIComponent(q)}`);
        setSugs(await r.json());
      } catch {
        setSugs([]);
      }
    }, 250);
  }, [q, city]);

  async function pickCity(c: City) {
    setCity(c);
    setQ(c.city);
    setSugs([]);
    setPoints([]);
    setAddress("");
    onCost(zoneCost(c.zone));
    setLoadingPts(true);
    try {
      const r = await fetch(`/api/cdek/points?city=${c.code}`);
      setPoints(await r.json());
    } catch {
      setPoints([]);
    } finally {
      setLoadingPts(false);
    }
  }

  const cost = city ? zoneCost(city.zone) : 0;

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">Доставка СДЭК</h2>
      <p className="text-sm text-zinc-500">
        Введите город — подскажем ближайшие пункты выдачи СДЭК.
      </p>

      {/* Город с автоподсказкой */}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCity(null);
            onCost(0);
          }}
          placeholder="Город доставки"
          className="input"
          autoComplete="off"
        />
        {sugs.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-card">
            {sugs.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pickCity(c)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-50"
                >
                  {c.city}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Пункты выдачи */}
      {city && (
        <>
          {loadingPts ? (
            <p className="text-sm text-zinc-500">Ищем пункты выдачи…</p>
          ) : points.length > 0 ? (
            <select
              onChange={(e) => setAddress(e.target.value)}
              className="input"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите ближайший пункт выдачи ({points.length})
              </option>
              {points.map((p) => (
                <option key={p.code} value={`${p.address}${p.work ? ` (${p.work})` : ""}`}>
                  {p.address}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-amber-600">
              Пункты не найдены — впишите адрес пункта вручную ниже.
            </p>
          )}
        </>
      )}

      {/* Итоговый адрес — редактируемый */}
      <textarea
        name="deliveryAddress"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Адрес пункта выдачи СДЭК"
        required
        rows={2}
        className="input resize-none"
      />

      {/* Стоимость */}
      {city && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-700">Доставка СДЭК</span>
          <span className="font-bold text-brand-700">{formatPrice(cost)}</span>
        </div>
      )}

      <input type="hidden" name="deliveryCity" value={city?.code || ""} />
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/money";

type City = { code: number; city: string; region: string };
type Point = { code: string; name: string; address: string };

/**
 * Выбор доставки CDEK: город (автоподсказка) → пункт выдачи или курьер →
 * автоматический расчёт стоимости. Стоимость (в копейках) отдаётся наверх
 * через onCost; итоговая сумма пересчитывается на сервере при оформлении.
 */
export function CdekDelivery({ onCost }: { onCost: (kopecks: number) => void }) {
  const [cityQ, setCityQ] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [toDoor, setToDoor] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [point, setPoint] = useState<Point | null>(null);
  const [street, setStreet] = useState("");
  const [cost, setCost] = useState<number | null>(null);
  const [term, setTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Автоподсказка городов
  useEffect(() => {
    if (city && cityQ === `${city.city}, ${city.region}`) return;
    clearTimeout(debounce.current);
    if (cityQ.trim().length < 2) {
      setCities([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/cdek/cities?q=${encodeURIComponent(cityQ)}`);
        setCities(await r.json());
      } catch {
        setCities([]);
      }
    }, 300);
  }, [cityQ, city]);

  async function pickCity(c: City) {
    setCity(c);
    setCityQ(`${c.city}, ${c.region}`);
    setCities([]);
    setPoint(null);
    setPoints([]);
    if (!toDoor) {
      try {
        const r = await fetch(`/api/cdek/points?city=${c.code}`);
        setPoints(await r.json());
      } catch {
        setPoints([]);
      }
    }
  }

  // Пересчёт стоимости при готовности адреса назначения
  useEffect(() => {
    const ready = city && (toDoor ? street.trim().length > 3 : point);
    if (!ready) {
      setCost(null);
      onCost(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const r = await fetch("/api/cdek/calc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toCity: city!.code, toDoor }),
        });
        const j = await r.json();
        if (cancelled) return;
        if (j.cost != null) {
          setCost(j.cost);
          setTerm(j.termMin ? `${j.termMin}–${j.termMax} дн.` : "");
          onCost(Math.round(j.cost) * 100);
        } else {
          setErr("Не удалось рассчитать доставку — уточним при подтверждении заказа");
          setCost(null);
          onCost(0);
        }
      } catch {
        if (!cancelled) {
          setErr("Не удалось рассчитать доставку — уточним при подтверждении заказа");
          onCost(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, toDoor, point, street, onCost]);

  // Адрес — редактируемое поле (источник истины). Автозаполняется выбором
  // города/пункта, но покупатель может вписать вручную (если CDEK ещё не подключён).
  const [address, setAddress] = useState("");
  const composed = toDoor
    ? city && street.trim()
      ? `${city.city}, курьером: ${street}`
      : ""
    : point
      ? `${city?.city}, ПВЗ ${point.code}: ${point.address}`
      : "";
  useEffect(() => {
    if (composed) setAddress(composed);
  }, [composed]);

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">Доставка СДЭК</h2>

      {/* Тип доставки */}
      <div className="flex gap-2">
        {[
          { d: false, label: "Пункт выдачи" },
          { d: true, label: "Курьером до двери" },
        ].map((o) => (
          <button
            key={String(o.d)}
            type="button"
            onClick={() => {
              setToDoor(o.d);
              setPoint(null);
              if (!o.d && city) pickCity(city);
            }}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              toDoor === o.d
                ? "bg-gradient-to-r from-brand-400 to-brand-500 text-white shadow-glow"
                : "bg-white text-zinc-600 shadow-card hover:text-brand-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Город */}
      <div className="relative">
        <input
          value={cityQ}
          onChange={(e) => {
            setCityQ(e.target.value);
            setCity(null);
          }}
          placeholder="Город доставки"
          className="input"
          autoComplete="off"
        />
        {cities.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-card">
            {cities.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pickCity(c)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-50"
                >
                  {c.city}
                  {c.region ? <span className="text-zinc-400">, {c.region}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Пункт выдачи или адрес курьера */}
      {city && !toDoor && (
        <select
          value={point?.code || ""}
          onChange={(e) => setPoint(points.find((p) => p.code === e.target.value) || null)}
          className="input"
        >
          <option value="">
            {points.length ? "Выберите пункт выдачи" : "Пункты выдачи не найдены"}
          </option>
          {points.map((p) => (
            <option key={p.code} value={p.code}>
              {p.address || p.name}
            </option>
          ))}
        </select>
      )}
      {city && toDoor && (
        <input
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Улица, дом, квартира"
          className="input"
        />
      )}

      {/* Стоимость */}
      {loading && <p className="text-sm text-zinc-500">Считаем стоимость доставки…</p>}
      {err && <p className="text-sm text-amber-600">{err}</p>}
      {cost != null && !loading && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-700">
            Доставка{term ? ` · ${term}` : ""}
          </span>
          <span className="font-bold text-brand-700">{formatPrice(cost * 100)}</span>
        </div>
      )}

      {/* Итоговый адрес — редактируемый (можно вписать вручную) */}
      <textarea
        name="deliveryAddress"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Город и адрес пункта выдачи / доставки"
        required
        rows={2}
        className="input resize-none"
      />
      <input type="hidden" name="deliveryCity" value={city?.code || ""} />
      <input type="hidden" name="deliveryToDoor" value={toDoor ? "1" : ""} />
    </section>
  );
}

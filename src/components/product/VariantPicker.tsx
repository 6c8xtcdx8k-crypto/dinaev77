"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/actions/cart";

export type VariantData = {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
};

/**
 * Выбор цвета и размера (как на маркетплейсах): сначала цвет,
 * затем размеры доступные для этого цвета; недоступные — перечёркнуты.
 */
export function VariantPicker({ variants }: { variants: VariantData[] }) {
  const router = useRouter();
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((v) => map.set(v.color, v.colorHex));
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const [color, setColor] = useState(colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const sizesForColor = useMemo(() => {
    const all = [...new Set(variants.map((v) => v.size))].sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      const order = ["XS", "S", "M", "L", "XL", "XXL"];
      return order.indexOf(a) - order.indexOf(b);
    });
    return all.map((s) => {
      const variant = variants.find((v) => v.color === color && v.size === s);
      return { size: s, available: !!variant && variant.stock > 0, variant };
    });
  }, [variants, color]);

  const selected = variants.find((v) => v.color === color && v.size === size && v.stock > 0);

  function handleAdd() {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const res = await addToCartAction(selected.id, 1);
      if (res.ok) {
        setMessage({ kind: "ok", text: "Товар добавлен в корзину" });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: res.error ?? "Не удалось добавить" });
      }
    });
  }

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Цвет: <span className="font-normal text-zinc-500">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-pressed={c.name === color}
                onClick={() => {
                  setColor(c.name);
                  setSize(null);
                  setMessage(null);
                }}
                className={`h-9 w-9 rounded-full border-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
                  c.name === color
                    ? "scale-110 border-brand-600 shadow-glow ring-2 ring-brand-200"
                    : "border-zinc-200"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">Размер</p>
        <div className="flex flex-wrap gap-2">
          {sizesForColor.map(({ size: s, available }) => (
            <button
              key={s}
              type="button"
              disabled={!available}
              aria-pressed={s === size}
              onClick={() => {
                setSize(s);
                setMessage(null);
              }}
              className={`min-w-12 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-300 ${
                s === size
                  ? "scale-105 border-brand-600 bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-glow"
                  : available
                    ? "border-zinc-300 bg-white hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card active:scale-95"
                    : "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-300 line-through"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {selected && selected.stock <= 3 && (
          <p className="mt-2 text-xs font-medium text-accent-600">
            Осталось всего {selected.stock} шт.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected || pending}
          className="btn-primary flex-1 !py-3 text-base"
        >
          {pending ? "Добавляем…" : size ? "В корзину" : "Выберите размер"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`animate-fade-up text-sm font-medium ${message.kind === "ok" ? "text-brand-700" : "text-red-600"}`}
        >
          {message.kind === "ok" ? "✓ " : ""}
          {message.text}
          {message.kind === "ok" && (
            <a href="/cart" className="ml-2 underline">
              Перейти в корзину
            </a>
          )}
        </p>
      )}
    </div>
  );
}

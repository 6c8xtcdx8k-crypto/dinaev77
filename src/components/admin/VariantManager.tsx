"use client";

import { useState, useTransition } from "react";
import {
  addVariantsBulkAction,
  updateVariantStockAction,
  deleteVariantAction,
} from "@/actions/admin";

type Variant = { id: string; size: string; color: string; colorHex: string; stock: number; sku: string };

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];
const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Чёрный", hex: "#27272a" },
  { name: "Белый", hex: "#f4f4f5" },
  { name: "Серый", hex: "#9ca3af" },
  { name: "Бежевый", hex: "#d6c7b0" },
  { name: "Розовый", hex: "#f9a8d4" },
  { name: "Голубой", hex: "#7dd3fc" },
  { name: "Синий", hex: "#3b82f6" },
  { name: "Красный", hex: "#ef4444" },
  { name: "Зелёный", hex: "#22c55e" },
  { name: "Фиолетовый", hex: "#a855f7" },
];

/**
 * Размеры, цвета и остатки. Выбираете один или несколько размеров,
 * один или несколько цветов, указываете остаток — создаются все
 * комбинации сразу. Остаток каждой строки правится на месте.
 */
export function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [customSize, setCustomSize] = useState("");
  const [colors, setColors] = useState<Map<string, string>>(new Map());
  const [customColor, setCustomColor] = useState("");
  const [customHex, setCustomHex] = useState("#ffb0eb");
  const [stock, setStock] = useState("10");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const combos = sizes.size * colors.size;

  function toggleSize(size: string) {
    const next = new Set(sizes);
    if (next.has(size)) next.delete(size);
    else next.add(size);
    setSizes(next);
    setMessage(null);
  }

  function toggleColor(name: string, hex: string) {
    const next = new Map(colors);
    if (next.has(name)) next.delete(name);
    else next.set(name, hex);
    setColors(next);
    setMessage(null);
  }

  function addCustomSize() {
    const s = customSize.trim();
    if (!s) return;
    toggleSize(s);
    setCustomSize("");
  }

  function addCustomColor() {
    const name = customColor.trim();
    if (!name) return;
    toggleColor(name, customHex);
    setCustomColor("");
  }

  function createAll() {
    setMessage(null);
    startTransition(async () => {
      const res = await addVariantsBulkAction(
        productId,
        [...sizes],
        [...colors.entries()].map(([name, hex]) => ({ name, hex })),
        parseInt(stock, 10) || 0,
      );
      if (res.ok) {
        setMessage({
          kind: "ok",
          text:
            `Создано вариантов: ${res.created}` +
            (res.skipped ? ` (пропущено уже существующих: ${res.skipped})` : ""),
        });
        setSizes(new Set());
        setColors(new Map());
      } else {
        setMessage({ kind: "error", text: res.error ?? "Ошибка" });
      }
    });
  }

  return (
    <div className="card p-5">
      <h3 className="mb-1 font-bold">Размеры, цвета и наличие</h3>
      <p className="mb-4 text-xs text-zinc-400">
        Отметьте размеры и цвета (можно несколько) и укажите остаток — все комбинации
        создадутся одной кнопкой. Остаток каждой строки меняется прямо в таблице.
      </p>

      {/* Существующие варианты */}
      {variants.length > 0 && (
        <table className="mb-5 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="py-2">Цвет</th>
              <th className="py-2">Размер</th>
              <th className="py-2">В наличии</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {variants.map((v) => (
              <VariantRow key={v.id} variant={v} productId={productId} />
            ))}
          </tbody>
        </table>
      )}

      {/* Размеры */}
      <p className="mb-1.5 text-sm font-semibold">
        1. Размеры <span className="font-normal text-zinc-400">— один или несколько</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {SIZE_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={sizes.has(s)}
            onClick={() => toggleSize(s)}
            className={`min-w-11 rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition ${
              sizes.has(s)
                ? "border-brand-400 bg-brand-300 text-[#8a1a5e]"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-300"
            }`}
          >
            {s}
          </button>
        ))}
        {/* выбранные нестандартные размеры */}
        {[...sizes].filter((s) => !SIZE_PRESETS.includes(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggleSize(s)}
            className="min-w-11 rounded-lg border border-brand-400 bg-brand-300 px-2.5 py-1.5 text-sm font-semibold text-[#8a1a5e]"
            title="Убрать"
          >
            {s} ✕
          </button>
        ))}
        <input
          value={customSize}
          onChange={(e) => setCustomSize(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
          placeholder="Свой (44, 36-38…)"
          className="input w-36 !py-1.5 text-sm"
        />
        <button type="button" onClick={addCustomSize} className="btn-secondary !px-3 !py-1.5 text-xs">
          +
        </button>
      </div>

      {/* Цвета */}
      <p className="mb-1.5 mt-4 text-sm font-semibold">
        2. Цвета <span className="font-normal text-zinc-400">— один или несколько</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-pressed={colors.has(c.name)}
            onClick={() => toggleColor(c.name, c.hex)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition ${
              colors.has(c.name)
                ? "border-brand-400 bg-brand-100 text-[#8a1a5e]"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-300"
            }`}
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-zinc-300"
              style={{ backgroundColor: c.hex }}
            />
            {c.name}
            {colors.has(c.name) && " ✓"}
          </button>
        ))}
        {[...colors.entries()]
          .filter(([name]) => !COLOR_PRESETS.some((c) => c.name === name))
          .map(([name, hex]) => (
            <button
              key={name}
              type="button"
              onClick={() => toggleColor(name, hex)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-400 bg-brand-100 px-2.5 py-1.5 text-sm font-medium text-[#8a1a5e]"
              title="Убрать"
            >
              <span className="h-3.5 w-3.5 rounded-full border border-zinc-300" style={{ backgroundColor: hex }} />
              {name} ✕
            </button>
          ))}
        <input
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
          placeholder="Свой цвет"
          className="input w-32 !py-1.5 text-sm"
        />
        <input
          type="color"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-lg border border-zinc-300 p-1"
          title="Оттенок для фильтра на сайте"
        />
        <button type="button" onClick={addCustomColor} className="btn-secondary !px-3 !py-1.5 text-xs">
          +
        </button>
      </div>

      {/* Остаток и создание */}
      <p className="mb-1.5 mt-4 text-sm font-semibold">3. Сколько в наличии (на каждую комбинацию)</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="input w-24 !py-2 text-sm"
          aria-label="Остаток"
        />
        <span className="text-sm text-zinc-400">шт.</span>
        <button
          type="button"
          disabled={pending || combos === 0}
          onClick={createAll}
          className="btn-primary !py-2 text-sm"
        >
          {pending
            ? "Создаём…"
            : combos > 0
              ? `Создать ${combos} ${combos === 1 ? "вариант" : combos < 5 ? "варианта" : "вариантов"}`
              : "Выберите размеры и цвета"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 animate-fade-up text-sm font-medium ${
            message.kind === "ok" ? "text-brand-700" : "text-red-600"
          }`}
        >
          {message.kind === "ok" ? "✓ " : ""}
          {message.text}
        </p>
      )}
    </div>
  );
}

function VariantRow({ variant, productId }: { variant: Variant; productId: string }) {
  const [stock, setStock] = useState(variant.stock);
  const [pending, startTransition] = useTransition();

  return (
    <tr>
      <td className="py-2">
        <span
          className="mr-2 inline-block h-3 w-3 rounded-full border border-zinc-200 align-middle"
          style={{ backgroundColor: variant.colorHex }}
        />
        {variant.color}
      </td>
      <td className="py-2 font-medium">{variant.size}</td>
      <td className="py-2">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          onBlur={() => {
            if (stock !== variant.stock) {
              startTransition(() => updateVariantStockAction(variant.id, stock));
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="input w-20 !px-2 !py-1 text-sm"
          aria-label={`Остаток ${variant.color} ${variant.size}`}
        />
        <span className="ml-1 text-xs text-zinc-400">шт.</span>
      </td>
      <td className="py-2 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Удалить вариант ${variant.color} / ${variant.size}?`)) {
              startTransition(() => deleteVariantAction(variant.id, productId));
            }
          }}
          className="text-xs text-zinc-400 underline hover:text-red-600"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}

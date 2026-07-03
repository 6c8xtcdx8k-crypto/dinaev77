"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addVariantAction,
  updateVariantStockAction,
  deleteVariantAction,
  type AdminFormState,
} from "@/actions/admin";

type Variant = { id: string; size: string; color: string; colorHex: string; stock: number; sku: string };

export function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    addVariantAction.bind(null, productId),
    undefined,
  );

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-bold">Варианты и остатки</h3>

      {variants.length > 0 && (
        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase text-zinc-400">
              <th className="py-2">Цвет</th>
              <th className="py-2">Размер</th>
              <th className="py-2">SKU</th>
              <th className="py-2">Остаток</th>
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

      <form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_100px_100px_auto]">
        <input name="color" placeholder="Цвет (Чёрный)" required className="input !py-2 text-sm" />
        <input name="size" placeholder="Размер (42 / M)" required className="input !py-2 text-sm" />
        <input name="colorHex" type="color" defaultValue="#888888" title="Цвет для фильтра" className="input h-10 !p-1" />
        <input name="stock" type="number" min="0" placeholder="Остаток" className="input !py-2 text-sm" />
        <button type="submit" disabled={pending} className="btn-secondary !py-2 text-sm">
          Добавить
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>}
    </div>
  );
}

function VariantRow({ variant, productId }: { variant: Variant; productId: string }) {
  const [stock, setStock] = useState(variant.stock);
  const [pending, startTransition] = useTransition();

  return (
    <tr>
      <td className="py-2">
        <span className="mr-2 inline-block h-3 w-3 rounded-full border border-zinc-200 align-middle" style={{ backgroundColor: variant.colorHex }} />
        {variant.color}
      </td>
      <td className="py-2">{variant.size}</td>
      <td className="py-2 text-xs text-zinc-400">{variant.sku}</td>
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
          className="input w-20 !px-2 !py-1 text-sm"
          aria-label={`Остаток ${variant.color} ${variant.size}`}
        />
      </td>
      <td className="py-2 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => deleteVariantAction(variant.id, productId))}
          className="text-xs text-zinc-400 underline hover:text-red-600"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}

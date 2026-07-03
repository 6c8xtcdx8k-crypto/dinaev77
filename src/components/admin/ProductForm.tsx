"use client";

import { useActionState } from "react";
import { createProductAction, updateProductAction, type AdminFormState } from "@/actions/admin";
import { GENDER_LABELS } from "@/lib/constants";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  gender: string;
  priceRub: number;
  discountPercent: number;
  isActive: boolean;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const action = product?.id
    ? updateProductAction.bind(null, product.id)
    : createProductAction;
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Название</span>
          <input name="name" defaultValue={product?.name} required className="input" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Slug (URL)</span>
          <input name="slug" defaultValue={product?.slug} required pattern="[a-z0-9-]+" className="input" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Описание</span>
        <textarea name="description" defaultValue={product?.description} rows={4} required className="input" />
      </label>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Категория</span>
          <select name="categoryId" defaultValue={product?.categoryId} required className="input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Для кого</span>
          <select name="gender" defaultValue={product?.gender ?? "UNISEX"} className="input">
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Цена, ₽</span>
          <input
            name="priceRub"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product ? product.priceRub : ""}
            required
            className="input"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Скидка, %</span>
          <input
            name="discountPercent"
            type="number"
            min="0"
            max="90"
            defaultValue={product?.discountPercent ?? 0}
            className="input"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4 accent-brand-600"
        />
        Показывать в каталоге
      </label>

      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm font-medium text-brand-700">✓ Сохранено</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Сохраняем…" : product?.id ? "Сохранить изменения" : "Создать товар"}
      </button>
    </form>
  );
}

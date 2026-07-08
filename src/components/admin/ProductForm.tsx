"use client";

import { useActionState, useState } from "react";
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
  oldPriceRub: number | null;
  isActive: boolean;
};

/** Транслитерация названия в slug — чтобы не вводить его вручную. */
function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

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

  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product?.id);
  const [price, setPrice] = useState(product ? String(product.priceRub) : "");
  const [oldPrice, setOldPrice] = useState(product?.oldPriceRub ? String(product.oldPriceRub) : "");

  const p = parseFloat(price);
  const op = parseFloat(oldPrice);
  const discount =
    p > 0 && op > p ? Math.round((1 - p / op) * 100) : 0;

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Название</span>
          <input
            name="name"
            defaultValue={product?.name}
            required
            className="input"
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Slug (адрес страницы) <span className="font-normal text-zinc-400">— заполняется сам</span>
          </span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            pattern="[a-z0-9-]+"
            className="input"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Описание</span>
        <textarea name="description" defaultValue={product?.description} rows={4} required className="input" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <span className="mb-1 block font-medium">Цена продажи, ₽</span>
          <input
            name="priceRub"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="input"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Старая цена, ₽ <span className="font-normal text-zinc-400">— необязательно</span>
          </span>
          <input
            name="oldPriceRub"
            type="number"
            step="0.01"
            min="0"
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="Для зачёркнутой цены"
            className="input"
          />
        </label>
      </div>

      {discount > 0 && (
        <p className="animate-fade-up text-sm">
          На карточке будет: <b>{p.toLocaleString("ru-RU")} ₽</b>{" "}
          <span className="text-zinc-400 line-through">{op.toLocaleString("ru-RU")} ₽</span>{" "}
          <span className="badge bg-gradient-to-r from-brand-400 to-brand-500 text-white">−{discount}%</span>
        </p>
      )}
      {op > 0 && p > 0 && op <= p && (
        <p className="text-sm text-red-600">Старая цена должна быть выше цены продажи — иначе она не покажется.</p>
      )}

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
      {state?.success && <p className="animate-fade-up text-sm font-medium text-brand-700">✓ Сохранено — каталог обновлён</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Сохраняем…" : product?.id ? "Сохранить изменения" : "Создать товар"}
      </button>
    </form>
  );
}

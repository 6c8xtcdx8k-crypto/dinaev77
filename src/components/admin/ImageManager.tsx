"use client";

import { useActionState, useTransition } from "react";
import {
  addProductImageAction,
  deleteProductImageAction,
  type AdminFormState,
} from "@/actions/admin";

type Image = { id: string; url: string; alt: string };

export function ImageManager({ productId, images }: { productId: string; images: Image[] }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    addProductImageAction.bind(null, productId),
    undefined,
  );
  const [deleting, startDelete] = useTransition();

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-bold">Изображения</h3>

      {images.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="h-28 w-20 rounded-lg object-cover" />
              <button
                type="button"
                disabled={deleting}
                onClick={() => startDelete(() => deleteProductImageAction(img.id, productId))}
                aria-label="Удалить изображение"
                className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white group-hover:flex"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex gap-2">
        <input name="url" placeholder="URL изображения (/products/… или https://…)" required className="input !py-2 text-sm" />
        <input name="alt" placeholder="Alt-текст" className="input !py-2 text-sm sm:max-w-40" />
        <button type="submit" disabled={pending} className="btn-secondary shrink-0 !py-2 text-sm">
          Добавить
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>}
    </div>
  );
}

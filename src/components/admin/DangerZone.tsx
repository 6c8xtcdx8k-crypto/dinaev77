"use client";

import { useState, useTransition } from "react";
import { deleteProductPermanentlyAction, toggleProductActiveAction } from "@/actions/admin";

/** Скрытие и полное удаление товара — с защитой от случайного нажатия. */
export function DangerZone({
  productId,
  productName,
  isActive,
}: {
  productId: string;
  productName: string;
  isActive: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const armed = confirmText.trim().toLowerCase() === "удалить";

  return (
    <div className="card border-red-200 p-5">
      <h3 className="mb-3 font-bold text-red-700">Опасная зона</h3>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-3">
        <p className="text-sm text-zinc-600">
          {isActive
            ? "Скрыть товар с сайта (данные сохранятся, можно вернуть в любой момент)."
            : "Товар скрыт с сайта — можно снова показать."}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => toggleProductActiveAction(productId))}
          className="btn-secondary !py-2 text-sm"
        >
          {isActive ? "Скрыть с сайта" : "Показать на сайте"}
        </button>
      </div>

      <div className="pt-3">
        <p className="text-sm text-zinc-600">
          Полное удаление: товар, его фото, варианты и отзывы исчезнут безвозвратно.
          История заказов не пострадает. Чтобы подтвердить, введите слово{" "}
          <b className="text-red-700">удалить</b>:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="удалить"
            className="input max-w-44 !py-2 text-sm"
          />
          <button
            type="button"
            disabled={!armed || pending}
            onClick={() => {
              if (!confirm(`Точно удалить «${productName}» навсегда?`)) return;
              setError(null);
              startTransition(async () => {
                const res = await deleteProductPermanentlyAction(productId);
                if (res && !res.ok) setError(res.error ?? "Ошибка");
              });
            }}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Удаляем…" : "Удалить навсегда"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}

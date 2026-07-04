"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReturnAction } from "@/actions/returns";
import { RETURN_REASONS } from "@/lib/constants";

/** Кнопка «Оформить возврат» у позиции доставленного заказа. */
export function ReturnButton({ orderItemId }: { orderItemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand-600 underline hover:text-brand-700"
      >
        Оформить возврат
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input w-auto !py-1.5 text-xs"
        aria-label="Причина возврата"
      >
        {RETURN_REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await createReturnAction(orderItemId, reason);
            if (res.ok) router.refresh();
            else setError(res.error ?? "Ошибка");
          });
        }}
        className="btn-primary !px-3 !py-1.5 text-xs"
      >
        {pending ? "Отправка…" : "Вернуть"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-zinc-400 underline"
      >
        Отмена
      </button>
      {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

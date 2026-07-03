"use client";

import { useState, useTransition } from "react";
import { setOrderStatusAction } from "@/actions/admin";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/constants";

export function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = ORDER_STATUS_TRANSITIONS[currentStatus as OrderStatus] ?? [];

  if (next.length === 0) {
    return <p className="text-sm text-zinc-400">Финальный статус — переходы недоступны.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {next.map((status) => (
          <button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await setOrderStatusAction(orderId, status);
                if (!res.ok) setError(res.error ?? "Ошибка");
              });
            }}
            className={
              status === "CANCELLED"
                ? "btn-secondary !border-red-200 !py-2 text-sm !text-red-600 hover:!border-red-400"
                : "btn-primary !py-2 text-sm"
            }
          >
            → {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Покупатель получит email-уведомление о смене статуса.
      </p>
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

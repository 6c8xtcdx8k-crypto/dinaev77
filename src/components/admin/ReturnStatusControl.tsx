"use client";

import { useState, useTransition } from "react";
import { setReturnStatusAction } from "@/actions/admin";
import { RETURN_STATUS_LABELS, RETURN_STATUS_TRANSITIONS, type ReturnStatus } from "@/lib/constants";

export function ReturnStatusControl({
  returnId,
  currentStatus,
}: {
  returnId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = RETURN_STATUS_TRANSITIONS[currentStatus as ReturnStatus] ?? [];

  if (next.length === 0) return <span className="text-xs text-zinc-400">Завершён</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {next.map((status) => (
        <button
          key={status}
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await setReturnStatusAction(returnId, status);
              if (!res.ok) setError(res.error ?? "Ошибка");
            });
          }}
          className={
            status === "REJECTED"
              ? "rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:border-red-400 disabled:opacity-50"
              : "rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          }
        >
          {RETURN_STATUS_LABELS[status]}
        </button>
      ))}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}

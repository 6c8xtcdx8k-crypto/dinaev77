"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SORT_OPTIONS } from "@/lib/constants";

function SortSelectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "new";

  return (
    <select
      value={current}
      aria-label="Сортировка"
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", e.target.value);
        next.delete("page");
        router.push(`/catalog?${next.toString()}`);
      }}
      className="input w-auto !py-2 text-sm"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function SortSelect() {
  return (
    <Suspense fallback={null}>
      <SortSelectInner />
    </Suspense>
  );
}

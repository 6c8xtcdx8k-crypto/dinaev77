"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SearchBarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
      }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Найти кроссовки, обувь, одежду…"
        className="input pr-11"
        aria-label="Поиск по каталогу"
      />
      <button
        type="submit"
        aria-label="Искать"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 p-2 text-white transition hover:bg-brand-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21L16.5 16.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

export function SearchBar() {
  return (
    <Suspense fallback={<div className="input h-[42px]" />}>
      <SearchBarInner />
    </Suspense>
  );
}

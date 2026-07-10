"use client";

import { useRouter } from "next/navigation";
import { goBackOr } from "@/components/telegram/TelegramInit";

/** Кнопка «Назад»: возвращает на предыдущую страницу, без истории — в каталог. */
export function BackButton({ fallback = "/catalog" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => goBackOr(router, fallback)}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-600 hover:shadow-card-hover active:scale-95"
      aria-label="Назад"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18L9 12L15 6" />
      </svg>
      Назад
    </button>
  );
}

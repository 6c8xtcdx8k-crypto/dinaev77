"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/actions/favorites";

export function FavoriteButton({
  productId,
  initialFavorited,
}: {
  productId: string;
  initialFavorited: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavoriteAction(productId);
          if (!res.ok && res.error === "AUTH_REQUIRED") {
            router.push("/login");
            return;
          }
          if (res.ok) setFavorited(res.favorited ?? !favorited);
        })
      }
      className={`group flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 active:scale-90 ${
        favorited
          ? "border-brand-500 bg-brand-50 text-brand-600 shadow-glow"
          : "border-zinc-300 bg-white text-zinc-500 hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-600 hover:shadow-card"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        className={favorited ? "animate-pop" : "transition-transform duration-300 group-hover:scale-110"}
      >
        <path d="M12 21C12 21 3 14.5 3 8.5C3 5.5 5.5 3 8.5 3C10 3 11.3 3.7 12 4.8C12.7 3.7 14 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14.5 12 21 12 21Z" />
      </svg>
    </button>
  );
}

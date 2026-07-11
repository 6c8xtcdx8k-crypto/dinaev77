"use client";

import { useState } from "react";

/**
 * Кнопка «Поделиться» карточкой товара.
 * В Telegram Mini App открывает нативное окно «отправить в чат»,
 * в браузере — системное меню «поделиться», иначе копирует ссылку.
 */
export function ShareButton({ name, price }: { name: string; price: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = `${name} — ${price}`;

    const webApp = window.Telegram?.WebApp;
    if (webApp?.initData && webApp.openTelegramLink) {
      webApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      );
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch {
        /* пользователь закрыл меню — ничего не делаем */
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard недоступен */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Поделиться товаром"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-600 hover:shadow-card active:scale-95"
      title={copied ? "Ссылка скопирована" : "Поделиться"}
    >
      {copied ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6L9 17L4 12" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5L15.4 17.5M15.4 6.5L8.6 10.5" />
        </svg>
      )}
    </button>
  );
}

"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

/**
 * Инициализация Telegram Mini App: подключает официальный SDK,
 * разворачивает окно и, если пользователь ещё не авторизован,
 * выполняет автовход по initData. Вне Telegram ничего не делает.
 */
export function TelegramInit({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();

  const onSdkReady = useCallback(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !webApp.initData) return; // открыто не из Telegram

    webApp.ready();
    webApp.expand();

    if (!isAuthed && sessionStorage.getItem("tg_auth_tried") !== "1") {
      sessionStorage.setItem("tg_auth_tried", "1");
      void fetch("/api/telegram/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: webApp.initData }),
      }).then((res) => {
        if (res.ok) router.refresh();
      });
    }
  }, [isAuthed, router]);

  return <Script src="https://telegram.org/js/telegram-web-app.js" onReady={onSdkReady} />;
}

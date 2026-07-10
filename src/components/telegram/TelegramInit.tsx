"use client";

import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

/**
 * Инициализация Telegram Mini App: подключает официальный SDK,
 * разворачивает окно и, если пользователь ещё не авторизован,
 * выполняет автовход по initData. Вне Telegram ничего не делает.
 */
/** Счётчик переходов внутри приложения: >1 — значит, есть куда возвращаться. */
export function navDepth(): number {
  return Number(sessionStorage.getItem("sb_nav_depth") || "0");
}

/** Назад по истории приложения; если возвращаться некуда — на fallback. */
export function goBackOr(router: { back: () => void; push: (h: string) => void }, fallback: string): void {
  if (navDepth() <= 1) {
    router.push(fallback);
    return;
  }
  const before = window.location.href;
  router.back();
  window.setTimeout(() => {
    if (window.location.href === before) router.push(fallback);
  }, 300);
}

export function TelegramInit({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sdkReady, setSdkReady] = useState(false);

  // Считаем внутренние переходы (для кнопок «Назад»).
  useEffect(() => {
    sessionStorage.setItem("sb_nav_depth", String(navDepth() + 1));
  }, [pathname]);

  const onSdkReady = useCallback(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !webApp.initData) return; // открыто не из Telegram

    webApp.ready();
    webApp.expand();
    setSdkReady(true);

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

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" onReady={onSdkReady} />
      {sdkReady && <TelegramBackButton />}
    </>
  );
}

/**
 * Нативная кнопка «Назад» Telegram Mini App: видна на всех страницах,
 * кроме главной. Возвращает на предыдущую страницу, а если истории
 * нет (карточку открыли по прямой ссылке) — на главную.
 */
function TelegramBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const back = window.Telegram?.WebApp?.BackButton;
    if (!back) return;

    if (pathname === "/") {
      back.hide();
      return;
    }

    const goBack = () => goBackOr(router, "/");
    back.onClick(goBack);
    back.show();
    return () => back.offClick(goBack);
  }, [pathname, router]);

  return null;
}

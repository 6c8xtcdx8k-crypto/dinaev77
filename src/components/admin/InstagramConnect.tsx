"use client";

import { useState, useTransition } from "react";
import { connectInstagramAction, disconnectInstagramAction } from "@/actions/admin";

/**
 * Подключение Instagram из настроек админки: владелец вставляет токен,
 * система сама проверяет его и определяет аккаунт. Никаких файлов и
 * переменных на сервере трогать не нужно.
 */
export function InstagramConnect({
  connected,
  username,
}: {
  connected: boolean;
  username: string | null;
}) {
  const [token, setToken] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function connect() {
    setMessage(null);
    startTransition(async () => {
      const res = await connectInstagramAction(token);
      if (res.ok) {
        setToken("");
        setMessage({ ok: true, text: `Подключено: @${res.username}` });
      } else {
        setMessage({ ok: false, text: res.error });
      }
    });
  }

  function disconnect() {
    setMessage(null);
    startTransition(async () => {
      await disconnectInstagramAction();
      setMessage({ ok: true, text: "Instagram отключён" });
    });
  }

  return (
    <div className="space-y-3">
      {connected && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 p-3 text-sm">
          <span>
            Подключён аккаунт{username ? <b> @{username}</b> : ""} — на карточках товаров
            есть кнопка «Опубликовать в Instagram».
          </span>
          <button
            type="button"
            onClick={disconnect}
            disabled={pending}
            className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
          >
            Отключить
          </button>
        </div>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          {connected ? "Заменить токен" : "Токен доступа Instagram"}
        </span>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="IGAA…"
          className="input font-mono text-xs"
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        onClick={connect}
        disabled={pending || !token.trim()}
        className="btn-primary !py-2 text-sm"
      >
        {pending ? "Проверяем…" : "Подключить"}
      </button>
      {message && (
        <p className={`text-sm font-medium ${message.ok ? "text-brand-700" : "text-red-600"}`}>
          {message.ok ? "✓ " : ""}
          {message.text}
        </p>
      )}
    </div>
  );
}

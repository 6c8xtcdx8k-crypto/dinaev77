"use client";

import { useState } from "react";

/** Кнопка «Подключить бота»: настраивает webhook и кнопку меню Mini App. */
export function TelegramSetup() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; text: string } | null>(null);

  async function run() {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/telegram/setup", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; bot?: string; link?: string; error?: string };
      if (json.ok) {
        setResult({ ok: true, text: `Готово! Бот ${json.bot} подключён: ${json.link}` });
      } else {
        setResult({ ok: false, text: json.error ?? "Не удалось настроить бота" });
      }
    } catch {
      setResult({ ok: false, text: "Сеть недоступна, попробуйте ещё раз" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button onClick={run} disabled={pending} className="btn-primary !py-2 text-sm">
        {pending ? "Настраиваю…" : "Подключить бота"}
      </button>
      {result && (
        <p className={`mt-2 text-sm font-medium ${result.ok ? "text-brand-700" : "text-red-600"}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}

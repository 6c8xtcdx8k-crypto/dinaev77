"use client";

import { useState } from "react";

/** Кнопка «Копировать» для адреса кошелька. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard недоступен — пользователь скопирует вручную */
        }
      }}
      className="shrink-0 rounded-lg bg-brand-300 px-3 py-1.5 text-xs font-bold text-[#8a1a5e] transition active:scale-95"
    >
      {copied ? "✓" : "Копировать"}
    </button>
  );
}

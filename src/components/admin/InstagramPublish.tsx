"use client";

import { useState, useTransition } from "react";
import { publishToInstagramAction } from "@/actions/admin";

/**
 * Кнопка «Опубликовать в Instagram» на карточке товара в админке.
 * Публикует фото товара (или карусель) с подписью: цена, размеры
 * и призыв заказать в Telegram-боте.
 */
export function InstagramPublish({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { ok: true; permalink: string | null } | { ok: false; error: string } | null
  >(null);

  function publish() {
    setResult(null);
    startTransition(async () => {
      setResult(await publishToInstagramAction(productId));
    });
  }

  return (
    <section className="card space-y-3 p-5">
      <h3 className="font-bold">Instagram</h3>
      <p className="text-sm text-zinc-500">
        Опубликует фото товара с ценой, размерами и подписью «заказать — в
        Telegram, ссылка в шапке профиля».
      </p>
      <button type="button" onClick={publish} disabled={pending} className="btn-secondary text-sm">
        {pending ? "Публикуем…" : "Опубликовать в Instagram"}
      </button>
      {result?.ok && (
        <p className="animate-fade-up text-sm font-medium text-brand-700">
          ✓ Опубликовано
          {result.permalink && (
            <>
              {" — "}
              <a
                href={result.permalink}
                target="_blank"
                rel="noopener"
                className="underline"
              >
                открыть пост
              </a>
            </>
          )}
        </p>
      )}
      {result && !result.ok && (
        <p className="text-sm font-medium text-red-600">{result.error}</p>
      )}
    </section>
  );
}

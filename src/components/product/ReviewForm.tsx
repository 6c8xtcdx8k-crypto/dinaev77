"use client";

import { useActionState, useState } from "react";
import { addReviewAction, type ReviewFormState } from "@/actions/reviews";

export function ReviewForm({ productId, isAuthed }: { productId: string; isAuthed: boolean }) {
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(
    addReviewAction,
    undefined,
  );
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (!isAuthed) {
    return (
      <p className="text-sm text-zinc-500">
        <a href="/login" className="font-medium text-brand-600 underline">
          Войдите
        </a>
        , чтобы оставить отзыв.
      </p>
    );
  }

  if (state?.success) {
    return <p className="font-medium text-brand-700">✓ Спасибо! Ваш отзыв опубликован.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <p className="mb-1 text-sm font-semibold">Ваша оценка</p>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Оценка ${i}`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className={i <= (hover || rating) ? "text-brand-400" : "text-zinc-300"}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <textarea
        name="text"
        rows={3}
        required
        placeholder="Расскажите о товаре: размер, качество, впечатления…"
        className="input"
      />

      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

      <button type="submit" disabled={pending || rating === 0} className="btn-primary">
        {pending ? "Отправка…" : "Оставить отзыв"}
      </button>
    </form>
  );
}

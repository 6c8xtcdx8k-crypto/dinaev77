"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordFormState } from "@/actions/auth";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordFormState, FormData>(
    changePasswordAction,
    undefined,
  );

  if (state?.success) {
    return (
      <p className="animate-fade-up font-medium text-brand-700">
        ✓ Пароль изменён. Используйте его при следующем входе.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="current"
        type="password"
        placeholder="Текущий пароль"
        required
        autoComplete="current-password"
        className="input"
      />
      <input
        name="next"
        type="password"
        placeholder="Новый пароль (минимум 8 символов)"
        required
        autoComplete="new-password"
        className="input"
      />
      <input
        name="confirm"
        type="password"
        placeholder="Новый пароль ещё раз"
        required
        autoComplete="new-password"
        className="input"
      />
      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Сохраняем…" : "Сменить пароль"}
      </button>
    </form>
  );
}

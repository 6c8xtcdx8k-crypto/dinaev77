"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type FormState } from "@/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="card mx-auto w-full max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">{mode === "login" ? "Вход" : "Регистрация"}</h1>

      {mode === "register" && (
        <input name="name" placeholder="Имя" required className="input" autoComplete="name" />
      )}
      <input name="email" type="email" placeholder="Email" required className="input" autoComplete="email" />
      <input
        name="password"
        type="password"
        placeholder="Пароль"
        required
        className="input"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />

      {state?.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Секунду…" : mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

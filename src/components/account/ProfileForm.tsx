"use client";

import { useActionState } from "react";
import { updateProfileAction, logoutAction, type FormState } from "@/actions/auth";

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null } }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    undefined,
  );

  return (
    <div className="card space-y-4 p-5">
      <h2 className="text-lg font-bold">Профиль</h2>
      <p className="text-sm text-zinc-500">{user.email}</p>
      <form action={formAction} className="space-y-3">
        <input name="name" defaultValue={user.name} placeholder="Имя" className="input" />
        <input name="phone" defaultValue={user.phone ?? ""} placeholder="Телефон" className="input" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-secondary w-full">
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>
      <form action={logoutAction}>
        <button type="submit" className="w-full text-sm text-zinc-400 underline hover:text-red-600">
          Выйти из аккаунта
        </button>
      </form>
    </div>
  );
}

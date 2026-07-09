import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { TelegramSetup } from "@/components/admin/TelegramSetup";

export const metadata: Metadata = { title: "Настройки — админка" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-md space-y-5">
      <div className="card p-5">
        <h2 className="font-bold">Аккаунт администратора</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Вход: <b>{user?.email}</b>. Доступ к панели есть только у аккаунтов
          с ролью администратора — покупатели видят обычный сайт.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-bold">Сменить пароль</h2>
        <PasswordForm />
        <p className="mt-3 text-xs text-zinc-400">
          Если магазин запускался со стандартным паролем — смените его сразу.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-bold">Telegram-бот</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Настраивает бота одним кликом: кнопку меню «Магазин» (Mini App),
          команду /start и мгновенные ответы (webhook). Токен бота должен быть
          задан в переменной окружения TELEGRAM_BOT_TOKEN.
        </p>
        <TelegramSetup />
      </div>
    </div>
  );
}

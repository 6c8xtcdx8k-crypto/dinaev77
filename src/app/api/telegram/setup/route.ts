import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Настройка Telegram-бота в один клик из админки (кнопка в «Настройках»).
 * Делает то же, что scripts/setup-telegram.ts: описание, команды,
 * кнопка меню с Mini App и webhook. Только для администратора.
 */

async function tg(method: string, payload?: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const json = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN не задан в переменных окружения" },
      { status: 400 },
    );
  }
  if (!baseUrl?.startsWith("https://")) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_BASE_URL должен быть публичным https-адресом сайта" },
      { status: 400 },
    );
  }

  try {
    const me = (await tg("getMe")) as { username: string };

    await tg("setMyDescription", {
      description:
        "Styleberries — одежда для женщин и мужчин. Откройте магазин кнопкой ниже.",
    });
    await tg("setMyShortDescription", { short_description: "Одежда для женщин и мужчин" });
    await tg("setMyCommands", {
      commands: [{ command: "start", description: "Открыть магазин" }],
    });
    await tg("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Магазин", web_app: { url: baseUrl } },
    });
    await tg("setWebhook", {
      url: `${baseUrl}/api/telegram/webhook`,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ["message"],
    });

    return NextResponse.json({
      ok: true,
      bot: `@${me.username}`,
      link: `https://t.me/${me.username}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Не удалось настроить бота";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

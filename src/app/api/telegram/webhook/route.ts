import { NextResponse } from "next/server";
import { botApi } from "@/lib/telegram";

/**
 * Webhook Telegram-бота. Регистрируется скриптом scripts/setup-telegram.ts
 * (setWebhook с secret_token). На /start отправляет кнопку, открывающую
 * Mini App с магазином.
 */
export async function POST(req: Request) {
  // Telegram присылает секрет, заданный при setWebhook — отсекаем чужие запросы.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let update: { message?: { chat?: { id: number }; text?: string } };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  // /id — узнать ID чата (нужно для ORDERS_CHAT_ID: добавьте бота
  // в служебный чат менеджеров и отправьте туда /id).
  if (chatId && text.startsWith("/id")) {
    await botApi("sendMessage", {
      chat_id: chatId,
      text: `ID этого чата: <code>${chatId}</code>\nВпишите его в ORDERS_CHAT_ID, чтобы заказы приходили сюда.`,
      parse_mode: "HTML",
    });
    return NextResponse.json({ ok: true });
  }

  if (chatId && text.startsWith("/start")) {
    await botApi("sendMessage", {
      chat_id: chatId,
      text:
        "Добро пожаловать в <b>Styleberries</b>!\n\n" +
        "Кроссовки, обувь и одежда для женщин и мужчин. " +
        "Нажмите кнопку ниже, чтобы открыть магазин.",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть магазин", web_app: { url: baseUrl } }]],
      },
    });
  }

  // Telegram ждёт 200 на любой update, иначе будет ретраить.
  return NextResponse.json({ ok: true });
}

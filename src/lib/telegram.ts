import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Работа с Telegram: валидация initData из Mini App и вызовы Bot API.
 * Токен бота задаётся переменной TELEGRAM_BOT_TOKEN (получить у @BotFather).
 */

/** Экранирование для parse_mode: "HTML" — имена и названия задаёт пользователь. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

const MAX_INITDATA_AGE_SEC = 24 * 60 * 60;

/**
 * Проверяет подпись initData из Telegram.WebApp по схеме из документации:
 * secret = HMAC_SHA256(key="WebAppData", data=bot_token);
 * hash   = HMAC_SHA256(key=secret, data=data_check_string).
 * Возвращает данные пользователя или null, если подпись невалидна/устарела.
 */
export function validateInitData(initData: string): { user: TelegramUser } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_INITDATA_AGE_SEC) return null;

  try {
    const user = JSON.parse(params.get("user") ?? "") as TelegramUser;
    if (!user?.id) return null;
    return { user };
  } catch {
    return null;
  }
}

/** Вызов метода Telegram Bot API. Возвращает false, если токен не настроен или запрос не удался. */
export async function botApi(method: string, payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[telegram] ${method} failed:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err);
    return false;
  }
}

/** Отправка сообщения пользователю (уведомления о заказе). Fire-and-forget. */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<void> {
  await botApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

/** Ссылка на чат с менеджером (env MANAGER_USERNAME, без @) с предзаполненным текстом. */
export function managerChatLink(text: string): string | null {
  const manager = process.env.MANAGER_USERNAME;
  if (!manager) return null;
  return `https://t.me/${manager}?text=${encodeURIComponent(text)}`;
}

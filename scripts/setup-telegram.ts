/**
 * Автонастройка Telegram-бота для Mini App. Делает за вас всё, что позволяет
 * Bot API: описание бота, команды, кнопку меню с Mini App и webhook.
 *
 * Предварительно (единственный ручной шаг, ~2 минуты):
 *   1. Напишите @BotFather в Telegram → /newbot → получите токен.
 *   2. Задеплойте сайт на публичный HTTPS-домен (например, Vercel).
 *   3. Заполните в .env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET,
 *      NEXT_PUBLIC_BASE_URL (публичный https-URL сайта).
 *
 * Запуск: npx tsx scripts/setup-telegram.ts
 */
try {
  process.loadEnvFile(); // Node 20.12+: читает .env без зависимостей
} catch {
  // .env отсутствует — используем переменные окружения процесса
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function api(method: string, payload?: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const json = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

async function main() {
  if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN не задан в .env (получите у @BotFather → /newbot)");
  if (!BASE_URL?.startsWith("https://"))
    throw new Error("NEXT_PUBLIC_BASE_URL должен быть публичным https-адресом задеплоенного сайта");

  const me = (await api("getMe")) as { username: string; first_name: string };
  console.log(`Бот найден: @${me.username} (${me.first_name})`);

  await api("setMyDescription", {
    description: "Styleberries — одежда и сумки для женщин и мужчин. Откройте магазин кнопкой ниже.",
  });
  await api("setMyShortDescription", {
    short_description: "Одежда и сумки",
  });
  console.log("Описание бота обновлено");

  await api("setMyCommands", {
    commands: [{ command: "start", description: "Открыть магазин" }],
  });
  console.log("Команды настроены");

  // Кнопка меню (слева от поля ввода) открывает Mini App.
  await api("setChatMenuButton", {
    menu_button: { type: "web_app", text: "Магазин", web_app: { url: BASE_URL } },
  });
  console.log(`Кнопка меню ведёт на ${BASE_URL}`);

  await api("setWebhook", {
    url: `${BASE_URL}/api/telegram/webhook`,
    secret_token: WEBHOOK_SECRET || undefined,
    allowed_updates: ["message"],
  });
  console.log(`Webhook: ${BASE_URL}/api/telegram/webhook`);

  console.log(`\nГотово! Откройте https://t.me/${me.username} и нажмите /start.`);
  console.log("Опционально: в @BotFather → /newapp можно создать прямую ссылку t.me/" + me.username + "/shop.");
}

main().catch((err) => {
  console.error("Ошибка настройки:", err.message ?? err);
  process.exit(1);
});

import { NextResponse } from "next/server";
import { sendTelegramMessage, sendTelegramPhoto, escapeHtml } from "@/lib/telegram";
import { getPaymentMethods, qrUrlFor } from "@/lib/payment";

/**
 * Webhook Telegram-бота: полностью автономные ответы, магазин работает
 * без участия владельца. Регистрируется scripts/setup-telegram.ts.
 *
 * Что умеет бот сам:
 *  - /start и кнопка «Открыть магазин» → Mini App;
 *  - /pay, «оплата», «реквизиты» → номер карты + QR-код;
 *  - «оплатил», чек/фото → просьба подождать проверку + сигнал владельцу;
 *  - любой другой вопрос → подсказка с кнопкой магазина;
 *  - /id → id чата (для настройки ORDERS_CHAT_ID).
 * О каждом присланном подтверждении оплаты владелец получает сообщение
 * в служебный чат.
 */

const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL ?? "";
const shopButton = () => ({ inline_keyboard: [[{ text: "🛍 Открыть магазин", web_app: { url: baseUrl() } }]] });

export async function POST(req: Request) {
  // Telegram присылает секрет, заданный при setWebhook — отсекаем чужие запросы.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let update: {
    message?: {
      chat?: { id: number };
      from?: { first_name?: string; username?: string };
      text?: string;
      photo?: unknown[];
      document?: unknown;
      caption?: string;
    };
  };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  const chatId = msg?.chat?.id;
  if (!chatId) return NextResponse.json({ ok: true });

  const text = (msg.text ?? msg.caption ?? "").trim();
  const lower = text.toLowerCase();
  const hasPhoto = Array.isArray(msg.photo) && msg.photo.length > 0;
  const hasDocument = !!msg.document; // чек, присланный файлом (PDF)
  const firstName = msg.from?.first_name ? escapeHtml(msg.from.first_name) : "друг";

  try {
    // --- Служебное: id чата ---
    if (lower.startsWith("/id")) {
      await sendTelegramMessage(
        chatId,
        `ID этого чата: <code>${chatId}</code>\nВпишите его в ORDERS_CHAT_ID, чтобы заказы приходили сюда.`,
      );
      return NextResponse.json({ ok: true });
    }

    // --- Старт ---
    if (lower.startsWith("/start")) {
      await sendTelegramMessage(
        chatId,
        `Здравствуйте, ${firstName}! 👋\n\n` +
          "Добро пожаловать в <b>Styleberries</b> — одежда и сумки для женщин и мужчин.\n" +
          "Нажмите кнопку ниже, чтобы открыть магазин и оформить заказ.",
        shopButton(),
      );
      return NextResponse.json({ ok: true });
    }

    // --- Чек об оплате: фото/документ или явное подтверждение оплаты ---
    // (вопросы «как оплатить» сюда не попадают — они уходят в блок реквизитов ниже)
    if (
      hasPhoto ||
      hasDocument ||
      /оплатил|оплатила|оплачен|перевёл|перевел|перевела|скинул|отправил чек|вот чек|чек|квитанц|paid/.test(lower)
    ) {
      await sendTelegramMessage(
        chatId,
        "Спасибо, чек получил! 🙏\n\n" +
          "Пожалуйста, подождите — проверяю поступление оплаты. " +
          "Как только всё подтвердится, пришлю сообщение о статусе заказа. Это займёт немного времени 🙌",
      );
      // Сигнал владельцу: клиент прислал чек — нужно проверить поступление.
      const ownerChat = process.env.ORDERS_CHAT_ID;
      if (ownerChat) {
        const who = msg.from?.username ? `@${escapeHtml(msg.from.username)}` : firstName;
        await sendTelegramMessage(
          ownerChat,
          `💳 <b>${who}</b> прислал(а) чек об оплате. ` +
            `Проверьте поступление и подтвердите заказ в админке (статус «Оплачен»).`,
        );
      }
      return NextResponse.json({ ok: true });
    }

    // --- Реквизиты оплаты ---
    if (lower.startsWith("/pay") || /реквизит|оплат|куда плат|карт|qr/.test(lower)) {
      const methods = getPaymentMethods();
      if (methods.length > 0) {
        await sendTelegramMessage(chatId, "Реквизиты для оплаты:");
        for (const m of methods) {
          await sendTelegramPhoto(
            chatId,
            qrUrlFor(m.qrData),
            `<b>${m.title}</b>\n${m.label}:\n<code>${escapeHtml(m.value)}</code>\n\n` +
              "Отсканируйте QR или скопируйте реквизиты. После оплаты пришлите чек — подтвержу заказ после проверки поступления.",
          );
        }
      } else {
        await sendTelegramMessage(chatId, "Реквизиты для оплаты пришлём после оформления заказа.", shopButton());
      }
      return NextResponse.json({ ok: true });
    }

    // --- Помощь / что умеет бот ---
    if (lower.startsWith("/help") || /помощ|как купить|как заказ|привет|здравств|меню/.test(lower)) {
      await sendTelegramMessage(
        chatId,
        `Я бот магазина <b>Styleberries</b> 🛍\n\n` +
          "• «Открыть магазин» — каталог, выбор размера и цвета, оформление заказа\n" +
          "• После заказа я сразу пришлю реквизиты для оплаты (карта + QR)\n" +
          "• Оплатили — пришлите чек, и я подтвержу заказ после проверки поступления\n\n" +
          "Команды: /pay — реквизиты, /help — помощь.",
        shopButton(),
      );
      return NextResponse.json({ ok: true });
    }

    // --- Любое другое сообщение ---
    await sendTelegramMessage(
      chatId,
      `${firstName}, я на связи! 💬 Открывайте магазин кнопкой ниже, а после заказа я пришлю реквизиты для оплаты. ` +
        "Если оплатили — пришлите чек.",
      shopButton(),
    );
  } catch (err) {
    console.error("[telegram] webhook error:", err);
  }

  // Telegram ждёт 200 на любой update, иначе будет ретраить.
  return NextResponse.json({ ok: true });
}

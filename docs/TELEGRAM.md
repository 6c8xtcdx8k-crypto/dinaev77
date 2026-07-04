# Styleberries как Telegram Mini App

Магазин полностью работает внутри Telegram: пользователь открывает бота,
нажимает кнопку — и попадает в каталог. Вход происходит автоматически
по данным Telegram (без регистрации и паролей), уведомления о заказах
приходят сообщениями от бота.

## Как это устроено

```
Покупатель → бот (/start или кнопка меню)
           → Telegram открывает Mini App (наш сайт по HTTPS)
           → TelegramInit подключает telegram-web-app.js
           → POST /api/telegram/auth { initData }
           → сервер проверяет подпись HMAC и выдаёт cookie-сессию
           → дальше работают все обычные страницы: каталог, корзина, заказы
```

| Компонент | Файл | Роль |
|---|---|---|
| Валидация initData | `src/lib/telegram.ts` | Проверка подписи HMAC-SHA256 по алгоритму Telegram, отсечка устаревших данных (24 ч) |
| Автовход | `src/app/api/telegram/auth/route.ts` | Создание/поиск пользователя по `telegramId`, выдача сессии |
| Инициализация SDK | `src/components/telegram/TelegramInit.tsx` | `ready()`, `expand()`, автологин; вне Telegram не делает ничего |
| Webhook бота | `src/app/api/telegram/webhook/route.ts` | Ответ на `/start` кнопкой «Открыть магазин»; защищён secret token |
| Уведомления | `src/services/orders.ts → notifyTelegram()` | Сообщения о создании заказа и смене статуса в чат с ботом |
| Автонастройка | `scripts/setup-telegram.ts` | Описание, команды, кнопка меню, webhook — одной командой |

Сайт остаётся работоспособным и в обычном браузере (вход по email/паролю),
поэтому админка доступна с компьютера, а Mini App — покупателям.

## Запуск: 3 шага

### 1. Создайте бота (единственный ручной шаг, ~2 минуты)

В Telegram напишите [@BotFather](https://t.me/BotFather):

```
/newbot
→ имя: Styleberries
→ username: например, styleberries_shop_bot
```

BotFather выдаст **токен** — сохраните его.

### 2. Задеплойте сайт на публичный HTTPS

Telegram открывает Mini App только по публичному HTTPS-адресу.
Самый быстрый вариант — Vercel (репозиторий уже готов к деплою):
подключите репозиторий, задайте переменные окружения из `.env.example`
(база данных — PostgreSQL, например Neon/Supabase; в `prisma/schema.prisma`
смените provider на `postgresql`).

Заполните в окружении:

```
NEXT_PUBLIC_BASE_URL="https://ваш-домен"
TELEGRAM_BOT_TOKEN="токен от BotFather"
TELEGRAM_WEBHOOK_SECRET="любая случайная строка"
```

### 3. Запустите автонастройку

```bash
npm run telegram:setup
```

Скрипт сам: обновит описание бота, зарегистрирует команду `/start`,
повесит кнопку меню «Магазин», укажет webhook. После этого откройте
`t.me/<ваш_бот>` → `/start` → «Открыть магазин».

Опционально в @BotFather → `/newapp` можно создать прямую ссылку вида
`t.me/<бот>/shop` и загрузить обложку.

## Платежи внутри Telegram

Сейчас используется mock-шлюз (открывается страницей внутри Mini App).
Для продакшена есть два пути:

1. **Любой веб-эквайринг** (ЮKassa, CloudPayments) — реализуйте
   `PaymentProvider` (см. `docs/ARCHITECTURE.md → Платежи`); страница оплаты
   провайдера откроется внутри Mini App как обычный редирект.
2. **Telegram Payments** — платёж нативным окном Telegram: бот отправляет
   invoice через `sendInvoice` с токеном платёжного провайдера от BotFather,
   подтверждение приходит в webhook (`pre_checkout_query` → `successful_payment`).
   Каркас webhook уже есть в `src/app/api/telegram/webhook/route.ts`.

## Проверка без Telegram

Подпись initData можно протестировать локально: задайте тестовый
`TELEGRAM_BOT_TOKEN` в `.env` и сгенерируйте подписанный initData тем же
алгоритмом (пример — HMAC-цепочка в `src/lib/telegram.ts`). Невалидная
подпись, чужой токен и данные старше 24 часов отклоняются с кодом 401.

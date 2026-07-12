# Деплой Styleberries

Для Telegram Mini App нужен публичный HTTPS-адрес; все варианты ниже его дают.

## Вариант Vercel (рекомендуется, бесплатно)

Код уже адаптирован: скрипт `vercel-build` переключает Prisma на PostgreSQL,
накатывает схему, сидирует базу (демо-данные — только в пустую) и собирает
приложение; фото товаров при наличии `BLOB_READ_WRITE_TOKEN` уходят в
Vercel Blob.

1. vercel.com → **Add New → Project** → Import Git Repository →
   `6c8xtcdx8k-crypto/dinaev77`.
2. Settings → **Git → Production Branch** → `claude/styleberries-ecommerce-6lqyv1`.
3. Storage → **Create Database → Neon (Postgres)** → подключить к проекту
   (переменная `DATABASE_URL` добавится сама).
4. Storage → **Create → Blob** (добавится `BLOB_READ_WRITE_TOKEN`).
5. Settings → Environment Variables (Production):
   - `AUTH_SECRET` — длинная случайная строка (32+ символов)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — доступ в админку
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (случайная строка)
   - `PAYMENT_CARD`, `PAYMENT_CARD_QR` (опционально)
   - `ORDERS_CHAT_ID` — id чата владельца (бот подскажет по команде /id)
   - `NEXT_PUBLIC_BASE_URL` — `https://<проект>.vercel.app` (после первого
     деплоя, затем Redeploy)
6. Deploy. После деплоя зайдите в `/admin` → Настройки → **«Подключить
   бота»** — webhook и кнопка меню настроятся одним кликом.

Каждый push в production-ветку пересобирает сайт автоматически.

## Вариант VPS одной командой (если Vercel недоступен)

Подходит любой хостинг с VPS на Ubuntu/Debian: Timeweb Cloud, Beget, reg.ru,
Selectel и т.д. Хватит минимальной конфигурации (1 CPU / 1–2 ГБ RAM,
~250–400 ₽/мес). Свой домен не обязателен: скрипт использует бесплатный
адрес вида `1-2-3-4.sslip.io` (IP сервера через дефисы) и автоматически
выпускает HTTPS-сертификат Let's Encrypt через Caddy.

1. Создайте VPS (Ubuntu 22.04/24.04), откройте консоль сервера (SSH или
   веб-консоль в панели хостинга).
2. Выполните:

   ```bash
   bash <(curl -sL https://raw.githubusercontent.com/6c8xtcdx8k-crypto/dinaev77/claude/styleberries-ecommerce-6lqyv1/deploy/install.sh)
   ```

   Если репозиторий приватный — передайте GitHub-токен с правом чтения:
   `bash <(curl -sL … ) ghp_ваш_токен` (и сам install.sh тогда скачивайте
   с токеном либо скопируйте его содержимое в файл вручную).

3. Скрипт спросит домен (Enter — взять sslip.io) и токен бота, поставит
   Docker, соберёт образ и запустит магазин + HTTPS.
4. Настройка бота: `docker compose exec app npx tsx scripts/setup-telegram.ts`.

Что внутри: `Dockerfile` (standalone-сборка Next.js), `docker-compose.yml`
(приложение + Caddy), SQLite хранится на docker-volume `sbdata` — база
переживает перезапуски и обновления. Обновление кода:
`cd /opt/styleberries && git pull && docker compose up -d --build`.

## Вариант Б: Netlify (бесплатно, зарубежный)

Аналог Vercel, обычно доступен там, где Vercel нет.

1. Аккаунт на netlify.com → User settings → Applications → New access token.
2. База: neon.tech или supabase.com → connection string PostgreSQL
   (SQLite на serverless-платформах не работает).
3. В `prisma/schema.prisma` замените `provider = "sqlite"` на `"postgresql"`.
4. Пришлите токен Netlify и DATABASE_URL — деплой через Netlify CLI
   выполняется без доступа к вашему аккаунту в браузере.

## Вариант В: Railway (просто, $5 стартового кредита)

railway.com → аккаунт → Account → Tokens. Railway умеет собирать Dockerfile
из репозитория и даёт публичный HTTPS-домен из коробки; Postgres добавляется
в один клик в том же проекте.

## Что прислать, чтобы я довёл запуск до конца

| Вариант | Что нужно от вас |
|---|---|
| А (VPS) | IP сервера + подтверждение, что install.sh отработал (или его вывод, если что-то упало) + токен бота |
| Б (Netlify) | Netlify token + DATABASE_URL от Neon/Supabase + токен бота |
| В (Railway) | Railway token + токен бота |

Дальше во всех вариантах я сам: прописываю переменные, настраиваю webhook и
кнопку меню бота (`npm run telegram:setup`) и присылаю рабочую ссылку
`t.me/ваш_бот`.

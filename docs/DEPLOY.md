# Деплой Styleberries

Три проверенных пути — выберите по ситуации. Для Telegram Mini App нужен
публичный HTTPS-адрес; все варианты ниже его дают.

## Вариант А: любой VPS одной командой (рекомендуется из России)

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

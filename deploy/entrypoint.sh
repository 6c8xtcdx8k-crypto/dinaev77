#!/bin/sh
# Старт контейнера: применить схему БД, при первом запуске залить демо-данные,
# затем поднять Next.js-сервер.
set -e

echo "[entrypoint] prisma db push…"
prisma db push --skip-generate --schema prisma/schema.prisma

if [ "${SEED_ON_START:-1}" = "1" ] && [ ! -f /app/data/.seeded ]; then
  echo "[entrypoint] первый запуск — заливаем демо-данные…"
  tsx prisma/seed.ts && touch /app/data/.seeded
fi

# Импорт товаров из канала поставщика (идемпотентен — существующие slug
# пропускаются). Фоном, чтобы не задерживать старт; лог — в volume.
if [ -f scripts/channel-products.json ]; then
  echo "[entrypoint] импорт товаров канала (в фоне, лог: /app/data/import.log)…"
  (tsx scripts/import-channel.ts >> /app/data/import.log 2>&1 || true) &
fi

echo "[entrypoint] запускаем сервер…"
exec node server.js

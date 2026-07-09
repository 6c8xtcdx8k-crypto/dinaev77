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

echo "[entrypoint] запускаем сервер…"
exec node server.js

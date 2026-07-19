#!/bin/bash
# Автообновление Styleberries: если в GitHub появились новые коммиты —
# подтянуть и пересобрать. Ставится в cron установщиком (install.sh),
# запускается каждую минуту; без обновлений выходит мгновенно.
#
# Логи: /var/log/styleberries-update.log
set -euo pipefail

DIR="/opt/styleberries"
cd "$DIR"

# Не запускаться поверх идущей сборки (сборка длится дольше минуты).
exec 9>/tmp/styleberries-update.lock
flock -n 9 || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Есть ли новые коммиты?
git fetch origin "$BRANCH" --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "[$(date '+%F %T')] Обновление: $LOCAL → $REMOTE"

# Что изменилось между текущей и новой версией?
CHANGED=$(git diff --name-only "$LOCAL" "$REMOTE")
git pull --quiet

# Быстрый путь: поменялись ТОЛЬКО данные каталога (scripts/*.json) — код тот же.
# Тогда не пересобираем образ (это минуты), а сразу дозаливаем товары в
# работающем контейнере: файлы каталога примонтированы с хоста и уже обновлены.
DATA_ONLY=1
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    scripts/*.json) ;;                 # данные — ок для быстрого пути
    *) DATA_ONLY=0 ;;                   # любой код → нужна пересборка
  esac
done <<< "$CHANGED"

RUNNING=$(docker compose ps -q app 2>/dev/null || true)

if [ "$DATA_ONLY" = "1" ] && [ -n "$RUNNING" ]; then
  echo "[$(date '+%F %T')] Только каталог — импорт без пересборки"
  if docker compose exec -d app sh -c 'tsx scripts/import-channel.ts >> /app/data/import.log 2>&1'; then
    echo "[$(date '+%F %T')] Импорт запущен (лог: /app/data/import.log)"
  else
    echo "[$(date '+%F %T')] Импорт не запустился — пересобираю образ"
    docker compose up -d --build
  fi
else
  # Пересборка. Если сборка упадёт — старый контейнер продолжит работать.
  if docker compose up -d --build 2>&1; then
    echo "[$(date '+%F %T')] Обновлено успешно"
    docker image prune -f > /dev/null 2>&1 || true
  else
    echo "[$(date '+%F %T')] ОШИБКА сборки — работает предыдущая версия"
  fi
fi

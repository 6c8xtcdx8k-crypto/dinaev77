#!/bin/bash
# Автообновление Styleberries: если в GitHub появились новые коммиты —
# подтянуть и пересобрать. Ставится в cron установщиком (install.sh),
# запускается раз в 10 минут. Если обновлений нет — выходит мгновенно.
#
# Логи: /var/log/styleberries-update.log
set -euo pipefail

DIR="/opt/styleberries"
cd "$DIR"

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Есть ли новые коммиты?
git fetch origin "$BRANCH" --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "[$(date '+%F %T')] Обновление: $LOCAL → $REMOTE"
git pull --quiet

# Пересборка. Если сборка упадёт — старый контейнер продолжит работать.
if docker compose up -d --build 2>&1; then
  echo "[$(date '+%F %T')] Обновлено успешно"
  docker image prune -f > /dev/null 2>&1 || true
else
  echo "[$(date '+%F %T')] ОШИБКА сборки — работает предыдущая версия"
fi

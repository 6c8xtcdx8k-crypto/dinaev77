#!/bin/bash
# Установка Styleberries на чистый Ubuntu/Debian VPS одной командой.
#
#   bash <(curl -sL https://raw.githubusercontent.com/<owner>/<repo>/<branch>/deploy/install.sh) \
#        [GITHUB_TOKEN]
#
# Скрипт: ставит Docker, клонирует репозиторий, генерирует .env
# (домен вида <ip-через-дефисы>.sslip.io — свой домен не обязателен),
# собирает и запускает магазин с автоматическим HTTPS.
set -euo pipefail

REPO="6c8xtcdx8k-crypto/dinaev77"
BRANCH="claude/styleberries-ecommerce-6lqyv1"
DIR="/opt/styleberries"
GH_TOKEN="${1:-${GITHUB_TOKEN:-}}"

echo "==> Устанавливаю Docker (если ещё нет)…"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Клонирую код…"
if [ -n "$GH_TOKEN" ]; then
  CLONE_URL="https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git"
else
  CLONE_URL="https://github.com/${REPO}.git"
fi
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull
else
  git clone --branch "$BRANCH" --depth 1 "$CLONE_URL" "$DIR"
fi
cd "$DIR"

echo "==> Готовлю .env…"
IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')
DOMAIN_DEFAULT="${IP//./-}.sslip.io"
if [ ! -f .env ]; then
  read -rp "Домен [${DOMAIN_DEFAULT}]: " DOMAIN_IN
  DOMAIN="${DOMAIN_IN:-$DOMAIN_DEFAULT}"
  read -rp "Токен Telegram-бота (можно оставить пустым и добавить позже): " TG_TOKEN
  cat > .env <<ENV
DOMAIN=${DOMAIN}
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}
AUTH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '=+/')
TELEGRAM_BOT_TOKEN=${TG_TOKEN}
TELEGRAM_WEBHOOK_SECRET=$(head -c 16 /dev/urandom | base64 | tr -d '=+/')
EMAIL_PROVIDER=console
PAYMENT_PROVIDER=mock
ENV
  echo "    .env создан (домен: ${DOMAIN})"
else
  echo "    .env уже существует — не трогаю"
fi

echo "==> Собираю и запускаю (первая сборка занимает несколько минут)…"
docker compose up -d --build

DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2)
echo
echo "================================================================"
echo " Готово! Магазин поднимается на https://${DOMAIN}"
echo " (сертификат выпускается ~30–60 секунд после старта)"
echo
echo " Настроить Telegram-бота (после заполнения TELEGRAM_BOT_TOKEN в .env):"
echo "   cd ${DIR} && docker compose exec app npx tsx scripts/setup-telegram.ts"
echo
echo " Логи:        docker compose logs -f app"
echo " Обновление:  git pull && docker compose up -d --build"
echo "================================================================"

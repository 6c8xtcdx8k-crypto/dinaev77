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
  read -rp "Username менеджера в Telegram без @ (для кнопки «Написать менеджеру»): " MANAGER
  read -rp "Email администратора [admin@styleberries.example]: " ADMIN_EMAIL_IN
  ADMIN_EMAIL="${ADMIN_EMAIL_IN:-admin@styleberries.example}"
  ADMIN_PASSWORD=$(head -c 12 /dev/urandom | base64 | tr -d '=+/' | head -c 14)
  cat > .env <<ENV
DOMAIN=${DOMAIN}
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}
AUTH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '=+/')
TELEGRAM_BOT_TOKEN=${TG_TOKEN}
TELEGRAM_WEBHOOK_SECRET=$(head -c 16 /dev/urandom | base64 | tr -d '=+/')
MANAGER_USERNAME=${MANAGER}
# ID служебного чата для заказов: добавьте бота в чат, отправьте /id и впишите сюда
ORDERS_CHAT_ID=
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EMAIL_PROVIDER=console
ENV
  echo "    .env создан (домен: ${DOMAIN})"
else
  echo "    .env уже существует — не трогаю"
fi

echo "==> Собираю и запускаю (первая сборка занимает несколько минут)…"
docker compose up -d --build

echo "==> Включаю автообновление из GitHub (проверка каждую минуту)…"
chmod +x "$DIR/deploy/auto-update.sh"
CRON_LINE="* * * * * $DIR/deploy/auto-update.sh >> /var/log/styleberries-update.log 2>&1"
( crontab -l 2>/dev/null | grep -v "styleberries" ; echo "$CRON_LINE" ) | crontab -

DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2)
echo
echo "================================================================"
echo " Готово! Магазин поднимается на https://${DOMAIN}"
echo " (сертификат выпускается ~30–60 секунд после старта)"
echo
echo " Админ-панель: https://${DOMAIN}/admin"
grep -E '^ADMIN_(EMAIL|PASSWORD)=' .env | sed 's/^/   /'
echo "   Сохраните пароль — он показан только здесь (и в .env)."
echo
echo " Настроить Telegram-бота (после заполнения TELEGRAM_BOT_TOKEN в .env):"
echo "   cd ${DIR} && docker compose exec app npx tsx scripts/setup-telegram.ts"
echo
echo " Логи:            docker compose logs -f app"
echo " Автообновление:  включено — код из GitHub подтягивается сам"
echo "                                    (проверка каждую минуту)."
echo " Обновить сейчас: bash $DIR/deploy/auto-update.sh"
echo "================================================================"

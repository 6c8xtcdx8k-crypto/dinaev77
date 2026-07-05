# Styleberries — production-образ (Next.js standalone + SQLite на volume).
# Сборка:  docker build -t styleberries .
# Запуск:  см. docker-compose.yml (app + Caddy с автоматическим HTTPS)

# ---------- Сборка ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .
# Prisma-клиенту нужен любой DATABASE_URL на этапе генерации
ENV DATABASE_URL="file:./build.db"
RUN npm run build

# ---------- Рантайм ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"

# prisma CLI — для db push при старте, tsx — для сида
RUN npm install -g prisma@6 tsx@4 && apk add --no-cache openssl

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
# bcryptjs нужен сиду (prisma/seed.ts); Next бандлит его в чанки,
# но не кладёт в standalone node_modules
RUN npm install bcryptjs@^3 --no-audit --no-fund --no-save
COPY deploy/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && mkdir -p /app/data

EXPOSE 3000
VOLUME ["/app/data"]
ENTRYPOINT ["./entrypoint.sh"]

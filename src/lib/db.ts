import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Один экземпляр PrismaClient на процесс (hot-reload в dev создаёт модули заново).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * На проде (Neon/Postgres) используем serverless-драйвер Neon: запросы идут
 * через его прокси без постоянного TCP-пула у каждого инстанса, поэтому сайт
 * держит много параллельных serverless-функций на Vercel без упирания в лимит
 * соединений базы. Локально (SQLite) остаётся обычный клиент Prisma.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("postgres")) {
    // В Node-рантайме драйверу нужен конструктор WebSocket (для транзакций).
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

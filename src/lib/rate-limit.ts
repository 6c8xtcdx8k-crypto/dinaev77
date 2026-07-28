import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Rate-limiter с общим счётчиком в БД — работает поверх нескольких инстансов
 * (важно на Vercel, где память процесса у каждого инстанса своя).
 * Фиксированное окно: не более `limit` событий на ключ за `windowMs`.
 * Защищает вход, регистрацию, оформление заказов, загрузки и промокоды.
 *
 * Если БД недоступна — откатываемся на локальный лимит в памяти, чтобы
 * не пропускать флуд и при этом не блокировать честных пользователей.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const id = `${key}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowMs);

  try {
    let count: number;
    try {
      const row = await prisma.rateLimit.upsert({
        where: { id },
        create: { id, count: 1, expiresAt },
        update: { count: { increment: 1 } },
      });
      count = row.count;
    } catch {
      // Гонка при одновременном create одного ключа — добираем через update.
      const row = await prisma.rateLimit.update({
        where: { id },
        data: { count: { increment: 1 } },
      });
      count = row.count;
    }

    // Изредка подчищаем истёкшие окна, чтобы таблица не разрасталась.
    if (Math.random() < 0.02) {
      await prisma.rateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch(() => {});
    }

    return count <= limit;
  } catch (err) {
    console.error("[rate-limit] db unavailable, fallback to memory:", err);
    return memoryLimit(id, limit, windowMs, now);
  }
}

// ---------- Резервный лимит в памяти процесса (fallback) ----------

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

function memoryLimit(key: string, limit: number, windowMs: number, now: number): boolean {
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, times] of buckets) {
      if (times.length === 0 || now - times[times.length - 1] > windowMs) buckets.delete(k);
    }
  }
  const times = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= limit) {
    buckets.set(key, times);
    return false;
  }
  times.push(now);
  buckets.set(key, times);
  return true;
}

/** IP клиента за реверс-прокси (Caddy/Vercel проставляют X-Forwarded-For). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

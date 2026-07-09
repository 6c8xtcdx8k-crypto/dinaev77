import "server-only";
import { headers } from "next/headers";

/**
 * Простой rate-limiter в памяти процесса (для одного сервера этого достаточно).
 * Скользящее окно: не более `limit` событий на ключ за `windowMs`.
 * Защищает вход, регистрацию, оформление заказов и загрузки от перебора и флуда.
 */

const buckets = new Map<string, number[]>();

// Периодическая уборка, чтобы карта не росла бесконечно.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, times] of buckets) {
    if (times.length === 0 || now - times[times.length - 1] > 3_600_000) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const times = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= limit) {
    buckets.set(key, times);
    return false; // лимит исчерпан
  }
  times.push(now);
  buckets.set(key, times);
  return true;
}

/** IP клиента за реверс-прокси (Caddy проставляет X-Forwarded-For). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

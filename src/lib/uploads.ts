import "server-only";
import { randomUUID } from "crypto";
import path from "path";
import { prisma } from "@/lib/db";

/**
 * Хранилище загруженных изображений товаров: база данных (таблица Upload).
 * Работает одинаково на Vercel, VPS и локально, не зависит от платного
 * файлового хранилища (Vercel Blob на бесплатном тарифе блокируется
 * при превышении лимитов). Файлы раздаются маршрутом /uploads/[file];
 * он же продолжает отдавать старые файлы с диска (VPS) и из Blob.
 * Вернуть загрузку в Blob: переменная USE_BLOB=1.
 */

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");

// SVG намеренно не принимаем: в нём может быть встроенный скрипт (XSS).
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 МБ

export function extensionForMime(mime: string): string | null {
  return ALLOWED_TYPES[mime] ?? null;
}

/**
 * Сохраняет файл и возвращает URL вида /uploads/<имя> — всегда со своего
 * домена. Файл кладётся в базу данных; опционально (USE_BLOB=1) — в Blob.
 */
export async function saveUpload(buffer: Buffer, mime: string): Promise<string> {
  const ext = extensionForMime(mime);
  if (!ext) throw new Error("UNSUPPORTED_TYPE");
  const name = `${randomUUID()}${ext}`;

  if (process.env.USE_BLOB === "1" && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`products/${name}`, buffer, {
      access: "public",
      contentType: mime,
    });
    rememberBlobBase(blob.url);
    return `/uploads/${name}`;
  }

  await prisma.upload.create({ data: { name, mime, data: new Uint8Array(buffer) } });
  return `/uploads/${name}`;
}

/** Читает загруженный файл из БД (null — файла нет, ищите на диске/в Blob). */
export async function readUploadFromDb(
  name: string,
): Promise<{ mime: string; data: Buffer } | null> {
  const row = await prisma.upload.findUnique({ where: { name } });
  return row ? { mime: row.mime, data: Buffer.from(row.data) } : null;
}

// Базовый адрес blob-хранилища: из env или запоминается после загрузки.
let blobBaseCache: string | null = process.env.BLOB_PUBLIC_BASE?.replace(/\/$/, "") || null;

function rememberBlobBase(blobUrl: string): void {
  try {
    blobBaseCache = new URL(blobUrl).origin;
  } catch {
    /* не критично — есть fallback через list() */
  }
}

/** Возвращает origin публичного blob-хранилища (например https://xxx.public.blob.vercel-storage.com). */
export async function getBlobBase(): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  if (blobBaseCache) return blobBaseCache;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "products/", limit: 1 });
    if (blobs[0]) rememberBlobBase(blobs[0].url);
  } catch (err) {
    console.error("[uploads] blob base lookup failed:", err);
  }
  return blobBaseCache;
}

export function contentTypeForFile(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}

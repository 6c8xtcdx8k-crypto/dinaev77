import "server-only";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { put } from "@vercel/blob";

/**
 * Хранилище загруженных изображений товаров.
 * - На Vercel (есть BLOB_READ_WRITE_TOKEN) файлы уходят в Vercel Blob,
 *   URL получается абсолютный (https://…blob.vercel-storage.com/…).
 * - Иначе (VPS/локально) файл кладётся на диск: каталог задаётся UPLOAD_DIR
 *   (в Docker — /app/data/uploads на volume, локально — ./data/uploads),
 *   раздаётся маршрутом /uploads/[file].
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
 * домена. В Blob-режиме файл лежит в облаке, а маршрут /uploads/[file]
 * проксирует его: домен *.blob.vercel-storage.com у части провайдеров
 * недоступен, свой домен работает везде.
 */
export async function saveUpload(buffer: Buffer, mime: string): Promise<string> {
  const ext = extensionForMime(mime);
  if (!ext) throw new Error("UNSUPPORTED_TYPE");
  const name = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${name}`, buffer, {
      access: "public",
      contentType: mime,
    });
    rememberBlobBase(blob.url);
    return `/uploads/${name}`;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
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

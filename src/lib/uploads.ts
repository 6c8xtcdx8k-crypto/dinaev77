import "server-only";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

/**
 * Хранилище загруженных изображений товаров.
 * Каталог задаётся UPLOAD_DIR (в Docker — /app/data/uploads на volume,
 * локально — ./data/uploads). Файлы раздаются маршрутом /uploads/[file].
 */

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 МБ

export function extensionForMime(mime: string): string | null {
  return ALLOWED_TYPES[mime] ?? null;
}

/** Сохраняет файл и возвращает публичный URL вида /uploads/<uuid>.<ext>. */
export async function saveUpload(buffer: Buffer, mime: string): Promise<string> {
  const ext = extensionForMime(mime);
  if (!ext) throw new Error("UNSUPPORTED_TYPE");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
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

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, contentTypeForFile, getBlobBase, readUploadFromDb } from "@/lib/uploads";

/**
 * Раздача загруженных изображений товаров со своего домена.
 * Порядок поиска: база данных (основное хранилище) → диск (VPS/локально)
 * → Vercel Blob (старые файлы, если хранилище доступно).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  // Защита от path traversal: только имя файла, без разделителей.
  const safe = path.basename(file);
  if (safe !== file || !/^[\w.-]+$/.test(safe)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const headers = {
    "Content-Type": contentTypeForFile(safe),
    "Cache-Control": "public, max-age=31536000, immutable",
    // Кэш на CDN Vercel: файл читается из БД один раз, дальше отдаёт edge
    "CDN-Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    // Если в каталоге окажется svg — запретить исполнение скриптов
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };

  // 1. База данных — основное хранилище загрузок.
  try {
    const fromDb = await readUploadFromDb(safe);
    if (fromDb) {
      return new NextResponse(new Uint8Array(fromDb.data), {
        headers: { ...headers, "Content-Type": fromDb.mime },
      });
    }
  } catch {
    /* таблицы может ещё не быть — ищем в других источниках */
  }

  // 2. Диск (VPS/локально).
  try {
    const data = await readFile(path.join(UPLOAD_DIR, safe));
    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    /* нет на диске — пробуем Blob */
  }

  // 3. Vercel Blob (старые файлы).
  const blobBase = await getBlobBase();
  if (blobBase) {
    try {
      const res = await fetch(`${blobBase}/products/${safe}`, { cache: "no-store" });
      if (res.ok && res.body) return new NextResponse(res.body, { headers });
    } catch {
      /* ниже — общий 404 */
    }
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}

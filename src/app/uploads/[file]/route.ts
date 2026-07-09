import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, contentTypeForFile, getBlobBase } from "@/lib/uploads";

/**
 * Раздача загруженных изображений товаров со своего домена.
 * В Blob-режиме (Vercel) файл проксируется из облачного хранилища:
 * его домен у части провайдеров недоступен, свой — работает везде.
 * Иначе файл читается с диска (VPS/локально).
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
    "X-Content-Type-Options": "nosniff",
    // Если в каталоге окажется svg — запретить исполнение скриптов
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };

  const blobBase = await getBlobBase();
  if (blobBase) {
    try {
      const res = await fetch(`${blobBase}/products/${safe}`, {
        cache: "no-store",
      });
      if (!res.ok || !res.body) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      return new NextResponse(res.body, { headers });
    } catch {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  try {
    const data = await readFile(path.join(UPLOAD_DIR, safe));
    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

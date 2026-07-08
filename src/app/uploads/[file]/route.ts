import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, contentTypeForFile } from "@/lib/uploads";

/** Раздача загруженных изображений товаров из UPLOAD_DIR. */
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

  try {
    const data = await readFile(path.join(UPLOAD_DIR, safe));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeForFile(safe),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

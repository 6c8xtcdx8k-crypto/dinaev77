import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload, extensionForMime, MAX_UPLOAD_BYTES } from "@/lib/uploads";

/** Загрузка изображения товара из админки (multipart/form-data, поле file). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!extensionForMime(file.type)) {
    return NextResponse.json(
      { error: "Поддерживаются изображения: JPG, PNG, WebP, GIF, SVG" },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await saveUpload(buffer, file.type);
  return NextResponse.json({ url });
}

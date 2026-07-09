import { NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * Генерирует PNG с QR-кодом переданной строки (?data=…).
 * Используется для показа кошелька оплаты покупателю и в сообщении бота.
 */
export async function GET(req: Request) {
  const data = new URL(req.url).searchParams.get("data")?.trim();
  if (!data || data.length > 512) {
    return NextResponse.json({ error: "bad data" }, { status: 400 });
  }

  const png = await QRCode.toBuffer(data, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#2c2c2c", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

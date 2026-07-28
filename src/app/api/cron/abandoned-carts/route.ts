import { NextResponse } from "next/server";
import { sendAbandonedCartReminders } from "@/services/abandoned-cart";

export const dynamic = "force-dynamic";
// Крон-задача может выполняться дольше обычного запроса.
export const maxDuration = 60;

/**
 * Рассылает напоминания о брошенных корзинах. Вызывается по расписанию
 * (Vercel Cron, см. vercel.json). Защита: заголовок Authorization с CRON_SECRET
 * (Vercel Cron подставляет его автоматически, если переменная задана).
 * Также можно вызвать вручную: /api/cron/abandoned-carts?secret=<CRON_SECRET>.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const qs = new URL(req.url).searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sendAbandonedCartReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] abandoned-carts failed:", err);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

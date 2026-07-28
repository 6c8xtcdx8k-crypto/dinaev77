import { NextResponse } from "next/server";
import { getCart, getCartLines } from "@/lib/cart";
import { cdekCalc } from "@/lib/cdek";

export const dynamic = "force-dynamic";

/** Средний вес одной позиции, г (одежда/обувь/сумки в упаковке). */
export const ITEM_WEIGHT_GR = 700;

/** Расчёт стоимости доставки CDEK для текущей корзины. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const toCity = Number(body.toCity || 0);
  const toDoor = Boolean(body.toDoor);
  if (!toCity) return NextResponse.json({ error: "no_city" }, { status: 400 });

  const cart = await getCart();
  const lines = cart ? await getCartLines(cart.id) : [];
  const qty = lines.reduce((s, l) => s + l.qty, 0) || 1;

  try {
    const tariff = await cdekCalc({ toCity, weightGr: qty * ITEM_WEIGHT_GR, toDoor });
    if (!tariff) return NextResponse.json({ error: "no_tariff" }, { status: 502 });
    return NextResponse.json(tariff); // { cost, termMin, termMax } — рубли/дни
  } catch {
    return NextResponse.json({ error: "cdek_unavailable" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Пункты выдачи CDEK в городе — публичный список pvzlist (без ключей). */
export async function GET(req: Request) {
  const city = Number(new URL(req.url).searchParams.get("city") || 0);
  if (!city) return NextResponse.json([]);
  try {
    const r = await fetch(
      `https://integration.cdek.ru/pvzlist/v1/json?cityid=${city}`,
      { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!r.ok) return NextResponse.json([]);
    const data = await r.json();
    const pvz = Array.isArray(data?.pvz) ? data.pvz : [];
    const points = pvz
      .filter((p: Record<string, unknown>) => (p.type ?? "PVZ") !== "POSTAMAT")
      .slice(0, 60)
      .map((p: Record<string, any>) => ({
        code: String(p.code),
        address: String(p.fullAddress || p.address || ""),
        work: String(p.workTime || ""),
      }))
      .filter((p: { address: string }) => p.address);
    return NextResponse.json(points);
  } catch {
    return NextResponse.json([]);
  }
}

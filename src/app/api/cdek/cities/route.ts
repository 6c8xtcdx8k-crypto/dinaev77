import { NextResponse } from "next/server";
import cities from "@/data/cdek-cities.json";

export const dynamic = "force-dynamic";

type CityRow = { c: number; n: string; z: string };
const LIST = cities as CityRow[];

/** Автоподсказка городов из справочника CDEK (публичный, без ключей). */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json([]);
  const starts = LIST.filter((c) => c.n.toLowerCase().startsWith(q));
  const contains =
    q.length >= 3
      ? LIST.filter((c) => !c.n.toLowerCase().startsWith(q) && c.n.toLowerCase().includes(q))
      : [];
  const res = [...starts, ...contains]
    .slice(0, 8)
    .map((c) => ({ code: c.c, city: c.n, zone: c.z }));
  return NextResponse.json(res);
}

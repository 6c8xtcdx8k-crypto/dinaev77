import { NextResponse } from "next/server";
import { cdekPoints } from "@/lib/cdek";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const city = Number(new URL(req.url).searchParams.get("city") || 0);
  if (!city) return NextResponse.json([]);
  try {
    return NextResponse.json(await cdekPoints(city));
  } catch {
    return NextResponse.json([]);
  }
}

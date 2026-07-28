import { NextResponse } from "next/server";
import { cdekCities } from "@/lib/cdek";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  try {
    return NextResponse.json(await cdekCities(q));
  } catch {
    return NextResponse.json([]);
  }
}

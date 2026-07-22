import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Диагностика прогресса импорта (пишется в Setting "import_status"). */
export async function GET() {
  const row = await prisma.setting.findUnique({ where: { key: "import_status" } }).catch(() => null);
  const total = await prisma.product.count({ where: { isActive: true } }).catch(() => -1);
  let status: unknown = null;
  try {
    status = row ? JSON.parse(row.value) : null;
  } catch {
    status = row?.value ?? null;
  }
  return NextResponse.json({ status, activeProducts: total });
}

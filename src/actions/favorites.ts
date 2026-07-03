"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function toggleFavoriteAction(
  productId: string,
): Promise<{ ok: boolean; favorited?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "AUTH_REQUIRED" };

  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await prisma.favorite.findUnique({ where: key });

  if (existing) {
    await prisma.favorite.delete({ where: key });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/favorites");
  revalidatePath("/", "layout");
  return { ok: true, favorited: !existing };
}

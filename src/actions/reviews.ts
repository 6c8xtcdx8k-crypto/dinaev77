"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchasedProduct } from "@/lib/reviews";

export type ReviewFormState = { error?: string; success?: boolean } | undefined;

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Поставьте оценку").max(5),
  text: z.string().min(3, "Напишите пару слов о товаре").max(2000),
});

export async function addReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Чтобы оставить отзыв, войдите в аккаунт" };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    text: formData.get("text"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { productId, rating, text } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Товар не найден" };

  // Отзыв можно оставить только на купленный товар.
  if (!(await hasPurchasedProduct(user.id, product.slug))) {
    return { error: "Оставить отзыв можно только после заказа этого товара" };
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  });
  if (existing) return { error: "Вы уже оставили отзыв на этот товар" };

  // Отзыв + пересчёт агрегированного рейтинга — атомарно.
  await prisma.$transaction(async (tx) => {
    await tx.review.create({ data: { productId, userId: user.id, rating, text } });
    const agg = await tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    await tx.product.update({
      where: { id: productId },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        ratingCount: agg._count,
      },
    });
  });

  revalidatePath(`/product/${product.slug}`);
  return { success: true };
}

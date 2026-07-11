import "server-only";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";

/**
 * Публикация товаров в Instagram через официальный API
 * (Instagram API with Instagram Login, https://graph.instagram.com).
 *
 * Настройка: docs/INSTAGRAM.md. Нужны переменные окружения:
 *   INSTAGRAM_USER_ID      — ID аккаунта Instagram (Business/Creator)
 *   INSTAGRAM_ACCESS_TOKEN — долгоживущий токен доступа (~60 дней)
 *
 * Фото должны быть доступны по публичному URL (JPEG) — Instagram сам
 * скачивает их по ссылке; SVG-заглушки пропускаются.
 */

const GRAPH = "https://graph.instagram.com/v23.0";

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_USER_ID && process.env.INSTAGRAM_ACCESS_TOKEN);
}

type GraphResult = { id?: string; permalink?: string; error?: { message?: string } };

async function graph(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "POST",
): Promise<GraphResult> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
  const qs = new URLSearchParams({ ...params, access_token: token });
  const url = method === "GET" ? `${GRAPH}/${path}?${qs}` : `${GRAPH}/${path}`;
  const res = await fetch(url, {
    method,
    ...(method === "POST"
      ? { headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: qs }
      : {}),
  });
  return (await res.json()) as GraphResult;
}

/** Абсолютный публичный URL картинки; null — если картинка не подходит. */
function publicImageUrl(url: string): string | null {
  if (url.endsWith(".svg")) return null; // Instagram принимает только JPEG/PNG
  if (url.startsWith("http")) return url;
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${url}`;
}

function buildCaption(p: {
  name: string;
  basePrice: number;
  variants: { size: string }[];
}): string {
  const sizes = [...new Set(p.variants.map((v) => v.size))].filter((s) => s !== "ONE SIZE");
  const lines = [
    p.name,
    "",
    `Цена: ${formatPrice(p.basePrice)}`,
    ...(sizes.length > 0 ? [`Размеры: ${sizes.join(", ")}`] : []),
    "",
    "Доставка по всей России (СДЭК).",
    "Заказать — в нашем Telegram-боте, ссылка в шапке профиля.",
    "",
    "#одежда #сумки #стиль #шопинг #магазинодежды #доставкапороссии",
  ];
  return lines.join("\n");
}

/** Ждём, пока Instagram скачает и обработает фото (container status). */
async function waitUntilReady(creationId: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const st = await graph(`${creationId}`, { fields: "status_code" }, "GET");
    const code = (st as { status_code?: string }).status_code;
    if (code === "FINISHED") return;
    if (code === "ERROR") throw new Error("Instagram не смог обработать фото");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

export type PublishResult =
  | { ok: true; permalink: string | null }
  | { ok: false; error: string };

/**
 * Публикует товар в Instagram: одно фото или карусель (до 10 фото),
 * подпись с ценой, размерами и призывом заказать в Telegram.
 */
export async function publishProductToInstagram(productId: string): Promise<PublishResult> {
  if (!isInstagramConfigured()) {
    return { ok: false, error: "Instagram не подключён (см. docs/INSTAGRAM.md)" };
  }
  const userId = process.env.INSTAGRAM_USER_ID!;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sort: "asc" } },
      variants: { select: { size: true } },
    },
  });
  if (!product) return { ok: false, error: "Товар не найден" };

  const urls = product.images
    .map((img) => publicImageUrl(img.url))
    .filter((u): u is string => Boolean(u))
    .slice(0, 10);
  if (urls.length === 0) {
    return { ok: false, error: "У товара нет фото с публичным URL (нужен JPEG/PNG)" };
  }

  const caption = buildCaption(product);

  try {
    let creationId: string;

    if (urls.length === 1) {
      const media = await graph(`${userId}/media`, { image_url: urls[0], caption });
      if (!media.id) return { ok: false, error: media.error?.message ?? "Ошибка создания поста" };
      creationId = media.id;
    } else {
      // Карусель: контейнер на каждое фото, затем общий контейнер.
      const children: string[] = [];
      for (const url of urls) {
        const child = await graph(`${userId}/media`, { image_url: url, is_carousel_item: "true" });
        if (child.id) children.push(child.id);
      }
      if (children.length === 0) return { ok: false, error: "Instagram не принял ни одно фото" };
      const carousel = await graph(`${userId}/media`, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
      });
      if (!carousel.id) {
        return { ok: false, error: carousel.error?.message ?? "Ошибка создания карусели" };
      }
      creationId = carousel.id;
    }

    await waitUntilReady(creationId);

    const published = await graph(`${userId}/media_publish`, { creation_id: creationId });
    if (!published.id) {
      return { ok: false, error: published.error?.message ?? "Ошибка публикации" };
    }

    const info = await graph(`${published.id}`, { fields: "permalink" }, "GET");
    return { ok: true, permalink: info.permalink ?? null };
  } catch (err) {
    console.error("[instagram] publish failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Не удалось опубликовать" };
  }
}

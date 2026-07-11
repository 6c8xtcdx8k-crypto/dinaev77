import "server-only";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { getSetting, setSetting, deleteSetting } from "@/lib/settings";

/**
 * Публикация товаров в Instagram через официальный API
 * (Instagram API with Instagram Login, https://graph.instagram.com).
 *
 * Подключение — из админки (Настройки → Instagram): владелец вставляет
 * токен, ID аккаунта определяется автоматически и всё сохраняется в БД.
 * Переменные окружения INSTAGRAM_USER_ID / INSTAGRAM_ACCESS_TOKEN
 * работают как запасной вариант. Инструкция: docs/INSTAGRAM.md.
 *
 * Фото должны быть доступны по публичному URL (JPEG/PNG) — Instagram сам
 * скачивает их по ссылке; SVG-заглушки пропускаются.
 */

const GRAPH = "https://graph.instagram.com/v23.0";

const KEY_TOKEN = "instagram_access_token";
const KEY_USER_ID = "instagram_user_id";
const KEY_USERNAME = "instagram_username";

type Creds = { token: string; userId: string };

async function getCreds(): Promise<Creds | null> {
  const [token, userId] = await Promise.all([getSetting(KEY_TOKEN), getSetting(KEY_USER_ID)]);
  if (token && userId) return { token, userId };
  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) {
    return {
      token: process.env.INSTAGRAM_ACCESS_TOKEN,
      userId: process.env.INSTAGRAM_USER_ID,
    };
  }
  return null;
}

export async function isInstagramConfigured(): Promise<boolean> {
  return (await getCreds()) !== null;
}

/** Статус подключения для страницы настроек. */
export async function getInstagramStatus(): Promise<{ connected: boolean; username: string | null }> {
  const creds = await getCreds();
  if (!creds) return { connected: false, username: null };
  return { connected: true, username: await getSetting(KEY_USERNAME) };
}

type GraphResult = {
  id?: string;
  permalink?: string;
  user_id?: string;
  username?: string;
  error?: { message?: string };
};

async function graph(
  token: string,
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "POST",
): Promise<GraphResult> {
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

/**
 * Подключение аккаунта: проверяет токен запросом /me, сам узнаёт ID
 * и username аккаунта и сохраняет всё в настройках.
 */
export async function connectInstagram(
  rawToken: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const token = rawToken.trim();
  if (!token) return { ok: false, error: "Вставьте токен" };

  const me = await graph(token, "me", { fields: "user_id,username" }, "GET");
  if (!me.user_id) {
    return {
      ok: false,
      error: me.error?.message
        ? `Instagram не принял токен: ${me.error.message}`
        : "Instagram не принял токен — проверьте, что скопировали его целиком",
    };
  }

  await Promise.all([
    setSetting(KEY_TOKEN, token),
    setSetting(KEY_USER_ID, me.user_id),
    setSetting(KEY_USERNAME, me.username ?? ""),
  ]);
  return { ok: true, username: me.username ?? "" };
}

export async function disconnectInstagram(): Promise<void> {
  await Promise.all([
    deleteSetting(KEY_TOKEN),
    deleteSetting(KEY_USER_ID),
    deleteSetting(KEY_USERNAME),
  ]);
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
async function waitUntilReady(token: string, creationId: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const st = await graph(token, `${creationId}`, { fields: "status_code" }, "GET");
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
  const creds = await getCreds();
  if (!creds) {
    return { ok: false, error: "Instagram не подключён — Настройки → Instagram" };
  }
  const { token, userId } = creds;

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
      const media = await graph(token, `${userId}/media`, { image_url: urls[0], caption });
      if (!media.id) return { ok: false, error: media.error?.message ?? "Ошибка создания поста" };
      creationId = media.id;
    } else {
      // Карусель: контейнер на каждое фото, затем общий контейнер.
      const children: string[] = [];
      for (const url of urls) {
        const child = await graph(token, `${userId}/media`, {
          image_url: url,
          is_carousel_item: "true",
        });
        if (child.id) children.push(child.id);
      }
      if (children.length === 0) return { ok: false, error: "Instagram не принял ни одно фото" };
      const carousel = await graph(token, `${userId}/media`, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
      });
      if (!carousel.id) {
        return { ok: false, error: carousel.error?.message ?? "Ошибка создания карусели" };
      }
      creationId = carousel.id;
    }

    await waitUntilReady(token, creationId);

    const published = await graph(token, `${userId}/media_publish`, { creation_id: creationId });
    if (!published.id) {
      return { ok: false, error: published.error?.message ?? "Ошибка публикации" };
    }

    const info = await graph(token, `${published.id}`, { fields: "permalink" }, "GET");
    return { ok: true, permalink: info.permalink ?? null };
  } catch (err) {
    console.error("[instagram] publish failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Не удалось опубликовать" };
  }
}

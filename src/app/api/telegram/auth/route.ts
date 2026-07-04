import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { validateInitData } from "@/lib/telegram";
import { createSession, hashPassword } from "@/lib/auth";

/**
 * Автовход из Telegram Mini App: клиент присылает initData,
 * сервер проверяет подпись Telegram и выдаёт обычную cookie-сессию.
 * Аккаунт создаётся при первом входе и привязывается к telegramId.
 */
export async function POST(req: Request) {
  let initData: unknown;
  try {
    ({ initData } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (typeof initData !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const valid = validateInitData(initData);
  if (!valid) {
    return NextResponse.json({ error: "invalid initData" }, { status: 401 });
  }

  const tg = valid.user;
  const telegramId = String(tg.id);
  const name = [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || "Покупатель";

  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        name,
        // Синтетический email: вход у Telegram-пользователей только через Mini App.
        email: `tg${telegramId}@telegram.local`,
        passwordHash: await hashPassword(randomUUID()),
      },
    });
  } else if (user.name !== name) {
    user = await prisma.user.update({ where: { id: user.id }, data: { name } });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().min(2, "Укажите имя"),
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // Защита от флуда аккаунтами.
  if (!(await rateLimit(`register:${await getClientIp()}`, 5, 60 * 60 * 1000))) {
    return { error: "Слишком много регистраций — попробуйте позже" };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Пользователь с таким email уже существует" };

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await createSession(user.id);
  redirect("/account");
}

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Защита от перебора пароля: по IP и по конкретному аккаунту.
  const ip = await getClientIp();
  const email = parsed.data.email.toLowerCase();
  const [ipOk, accOk] = await Promise.all([
    rateLimit(`login-ip:${ip}`, 20, 10 * 60 * 1000),
    rateLimit(`login-acc:${email}`, 10, 10 * 60 * 1000),
  ]);
  if (!ipOk || !accOk) {
    return { error: "Слишком много попыток входа — подождите 10 минут" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/account");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

const profileSchema = z.object({
  name: z.string().min(2, "Укажите имя"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current: z.string().min(1, "Введите текущий пароль"),
    next: z.string().min(8, "Новый пароль — минимум 8 символов"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "Пароли не совпадают" });

export type PasswordFormState = { error?: string; success?: boolean } | undefined;

/** Смена пароля текущего пользователя (используется в настройках админки). */
export async function changePasswordAction(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется вход" };

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, full.passwordHash))) {
    return { error: "Текущий пароль неверный" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });
  return { success: true };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Требуется вход" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  return undefined;
}

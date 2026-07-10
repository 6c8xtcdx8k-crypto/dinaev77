/**
 * Базовое наполнение: категории и администратор.
 * Товары загружаются отдельно (scripts/import-channel.ts).
 *
 * Запуск: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // Категории
  const categories = [
    { slug: "clothing", name: "Одежда", sort: 1 },
    { slug: "bags", name: "Сумки", sort: 2 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const catBySlug = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  // Пользователи. Данные админа берутся из окружения (ADMIN_EMAIL /
  // ADMIN_PASSWORD); демо-значения — только для локальной разработки.
  const adminEmail = process.env.ADMIN_EMAIL || "admin@styleberries.example";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Администратор",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  // Демо-товары больше не создаются: реальный ассортимент загружает
  // scripts/import-channel.ts (товары каналов поставщиков).
  console.log("Seed complete.");
  console.log(`  Админ: ${adminEmail} / ${process.env.ADMIN_PASSWORD ? "(пароль из ADMIN_PASSWORD)" : "admin123"}`);
  void admin;
  void catBySlug;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Наполнение базы демо-данными: категории, товары с вариантами,
 * админ и тестовый покупатель, промокоды, отзывы.
 * Изображения товаров генерируются как SVG в public/products/.
 *
 * Запуск: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

// ---------- Генерация SVG-заглушек товаров ----------

const IMG_DIR = path.join(process.cwd(), "public", "products");

function wrapText(text: string, maxChars = 16): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function makeImage(slug: string, label: string, from: string, to: string): string {
  mkdirSync(IMG_DIR, { recursive: true });
  const lines = wrapText(label);
  const lineHeight = 52;
  const startY = 400 - ((lines.length - 1) * lineHeight) / 2;
  const textEls = lines
    .map(
      (line, i) =>
        `<text x="300" y="${startY + i * lineHeight}" font-size="40" text-anchor="middle"
        fill="#2c2c2c" font-family="Arial, sans-serif" font-weight="bold">${line}</text>`,
    )
    .join("\n  ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="300" cy="400" r="230" fill="rgba(255,255,255,0.45)"/>
  <circle cx="300" cy="400" r="160" fill="rgba(255,255,255,0.45)"/>
  ${textEls}
  <text x="300" y="740" font-size="22" text-anchor="middle" fill="rgba(44,44,44,0.4)"
        font-family="Arial, sans-serif" letter-spacing="4">STYLEBERRIES</text>
</svg>`;
  writeFileSync(path.join(IMG_DIR, `${slug}.svg`), svg);
  return `/products/${slug}.svg`;
}

// ---------- Данные ----------

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  category: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  priceRub: number;
  discountPercent?: number;

  gradient: [string, string];
  colors: { name: string; hex: string }[];
  sizes: string[];
  stockPerVariant?: number;
};

const PRODUCTS: SeedProduct[] = [
  // Одежда
  { slug: "berry-hoodie", name: "Худи оверсайз с начёсом", description: "Плотное худи свободного кроя с начёсом внутри. Капюшон на шнурке, карман-кенгуру.\n\n• Состав: 80% хлопок, 20% полиэстер\n• Плотность: 340 г/м²", category: "clothing", gender: "UNISEX", priceRub: 3990, discountPercent: 20, gradient: ["#ffb0eb", "#cdeafd"], colors: [{ name: "Зелёный", hex: "#059669" }, { name: "Чёрный", hex: "#27272a" }, { name: "Серый", hex: "#9ca3af" }], sizes: ["XS", "S", "M", "L", "XL"] },
  { slug: "berry-tshirt-basic", name: "Футболка базовая Berry", description: "Базовая футболка из плотного хлопка. Прямой крой, укреплённая горловина, без принта.\n\n• Состав: 100% хлопок\n• Плотность: 190 г/м²", category: "clothing", gender: "UNISEX", priceRub: 1490, gradient: ["#acdefc", "#f2f9ff"], colors: [{ name: "Белый", hex: "#f4f4f5" }, { name: "Чёрный", hex: "#27272a" }, { name: "Зелёный", hex: "#059669" }], sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { slug: "berry-dress-midi", name: "Платье миди Berry Bloom", description: "Струящееся платье миди с цветочным настроением: приталенный силуэт, юбка полусолнце.\n\n• Состав: вискоза\n• Длина: миди", category: "clothing", gender: "WOMEN", priceRub: 5490, discountPercent: 15, gradient: ["#ffb0eb", "#fff0fa"], colors: [{ name: "Розовый", hex: "#f9a8d4" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["XS", "S", "M", "L"] },
  { slug: "berry-jeans-m", name: "Джинсы прямые мужские Berry", description: "Классические прямые джинсы средней посадки из плотного денима с лёгким эффектом потёртости.\n\n• Состав: 99% хлопок, 1% эластан", category: "clothing", gender: "MEN", priceRub: 4990, gradient: ["#8ad2fd", "#e3f4fe"], colors: [{ name: "Синий", hex: "#3b82f6" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["S", "M", "L", "XL", "XXL"] },
  { slug: "berry-puffer-w", name: "Куртка стёганая женская Berry Warm", description: "Утеплённая стёганая куртка с высоким воротником и скрытым капюшоном. Ветро- и влагозащита.\n\n• Утеплитель: синтепух 200 г\n• Температура: до −10°C", category: "clothing", gender: "WOMEN", priceRub: 8990, discountPercent: 25, gradient: ["#cdeafd", "#ffc9ef"], colors: [{ name: "Фиолетовый", hex: "#a855f7" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["XS", "S", "M", "L", "XL"] },
  { slug: "berry-shirt-m", name: "Рубашка оксфорд мужская Berry", description: "Рубашка из ткани оксфорд с воротником button-down. Слегка свободный крой, подходит и к джинсам, и к брюкам.\n\n• Состав: 100% хлопок", category: "clothing", gender: "MEN", priceRub: 3490, gradient: ["#acdefc", "#cdeafd"], colors: [{ name: "Голубой", hex: "#7dd3fc" }, { name: "Белый", hex: "#f4f4f5" }], sizes: ["S", "M", "L", "XL"] },
  { slug: "berry-leggings-w", name: "Леггинсы спортивные Berry Move", description: "Леггинсы с высокой талией и утягивающим эффектом. Не просвечивают, быстро сохнут.\n\n• Состав: 75% нейлон, 25% эластан", category: "clothing", gender: "WOMEN", priceRub: 2490, discountPercent: 10, gradient: ["#ffe3f6", "#acdefc"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Зелёный", hex: "#059669" }], sizes: ["XS", "S", "M", "L"] },
  { slug: "berry-cap", name: "Кепка шестипанельная", description: "Классическая шестипанельная кепка с минималистичной вышивкой. Регулируемый ремешок сзади.\n\n• Состав: 100% хлопок", category: "clothing", gender: "UNISEX", priceRub: 1290, gradient: ["#ffc9ef", "#ffe3f6"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Зелёный", hex: "#059669" }], sizes: ["ONE SIZE"] },
  // Сумки (женские)
  { slug: "berry-bag-tote", name: "Сумка-тоут женская Berry Tote", description: "Вместительная сумка-тоут из мягкой экокожи: помещается ноутбук 13″, внутри карман на молнии.\n\n• Материал: экокожа\n• Размер: 38 × 30 × 12 см\n• Подкладка: текстиль", category: "bags", gender: "WOMEN", priceRub: 4990, discountPercent: 15, gradient: ["#ffb0eb", "#acdefc"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Бежевый", hex: "#d6c7b0" }], sizes: ["ONE SIZE"] },
  { slug: "berry-bag-cross", name: "Сумка кросс-боди Berry Mini", description: "Компактная сумка через плечо с регулируемым ремнём и золотистой фурнитурой. Для самого нужного: телефон, ключи, карты.\n\n• Материал: экокожа\n• Размер: 20 × 14 × 7 см", category: "bags", gender: "WOMEN", priceRub: 3490, gradient: ["#ffc9ef", "#fff0fa"], colors: [{ name: "Розовый", hex: "#f9a8d4" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["ONE SIZE"] },
  { slug: "berry-bag-shopper", name: "Шоппер женский Berry Daily", description: "Лёгкий шоппер на каждый день: выдерживает до 10 кг, складывается в собственный внутренний карман.\n\n• Материал: плотный хлопок\n• Размер: 40 × 35 см", category: "bags", gender: "WOMEN", priceRub: 2990, discountPercent: 20, gradient: ["#acdefc", "#ffe3f6"], colors: [{ name: "Бежевый", hex: "#d6c7b0" }, { name: "Голубой", hex: "#7dd3fc" }], sizes: ["ONE SIZE"] },
  { slug: "berry-bag-clutch", name: "Клатч вечерний Berry Night", description: "Изящный клатч с цепочкой для вечернего выхода: магнитная застёжка, съёмный ремешок.\n\n• Материал: экокожа\n• Размер: 24 × 14 × 5 см", category: "bags", gender: "WOMEN", priceRub: 3990, discountPercent: 10, gradient: ["#cdeafd", "#ffc9ef"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Серебристый", hex: "#d4d4d8" }], sizes: ["ONE SIZE"] },
];

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
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Анна Покупатель",
      passwordHash: await bcrypt.hash("customer123", 10),
      phone: "+7 900 000-00-00",
    },
  });

  // Товары
  for (const [i, p] of PRODUCTS.entries()) {
    const imageUrl = makeImage(p.slug, p.name, p.gradient[0], p.gradient[1]);
    // priceRub в данных — цена ДО скидки; при скидке она становится
    // «старой», а цена продажи считается со скидкой.
    const d = p.discountPercent ?? 0;
    const salePrice = d > 0 ? Math.round((p.priceRub * (100 - d)) / 100) * 100 : p.priceRub * 100;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        categoryId: catBySlug[p.category],
        gender: p.gender,
        basePrice: salePrice,
        oldPrice: d > 0 ? p.priceRub * 100 : null,
        discountPercent: d,
        salesCount: Math.max(0, 120 - i * 7),
        images: { create: [{ url: imageUrl, alt: p.name, sort: 0 }] },
        variants: {
          create: p.colors.flatMap((color) =>
            p.sizes.map((size) => ({
              sku: `${p.slug}-${color.name}-${size}`.toLowerCase().replace(/\s+/g, "-"),
              size,
              color: color.name,
              colorHex: color.hex,
              stock: p.stockPerVariant ?? 5 + ((i + size.length) % 8),
            })),
          ),
        },
      },
    });

    // Отзывы от демо-покупателя на часть товаров
    if (i % 3 === 0) {
      const rating = 4 + (i % 2);
      await prisma.review.upsert({
        where: { productId_userId: { productId: product.id, userId: customer.id } },
        update: {},
        create: {
          productId: product.id,
          userId: customer.id,
          rating,
          text: rating === 5
            ? "Отличное качество, размер соответствует. Рекомендую!"
            : "Хороший товар за свои деньги, доставка быстрая.",
        },
      });
      await prisma.product.update({
        where: { id: product.id },
        data: { ratingAvg: rating, ratingCount: 1 },
      });
    }
  }

  // Промокоды
  const promos = [
    { code: "BERRY10", type: "PERCENT", value: 10, minOrderTotal: 0, usageLimit: null as number | null },
    { code: "SUMMER500", type: "FIXED", value: 50000, minOrderTotal: 300000, usageLimit: 100 },
    { code: "VIP20", type: "PERCENT", value: 20, minOrderTotal: 1000000, usageLimit: 20 },
  ];
  for (const promo of promos) {
    await prisma.promoCode.upsert({ where: { code: promo.code }, update: {}, create: promo });
  }

  console.log("Seed complete.");
  console.log(`  Админ:      ${adminEmail} / ${process.env.ADMIN_PASSWORD ? "(пароль из ADMIN_PASSWORD)" : "admin123"}`);
  console.log(`  Покупатель: customer@example.com / customer123`);
  console.log(`  Промокоды:  BERRY10 (−10%), SUMMER500 (−500₽ от 3000₽), VIP20 (−20% от 10000₽)`);
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

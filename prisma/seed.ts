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

function makeImage(slug: string, label: string, emoji: string, from: string, to: string): string {
  mkdirSync(IMG_DIR, { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <text x="300" y="400" font-size="220" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="300" y="700" font-size="30" text-anchor="middle" fill="rgba(255,255,255,0.85)"
        font-family="Arial, sans-serif" font-weight="bold">${label}</text>
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
  emoji: string;
  gradient: [string, string];
  colors: { name: string; hex: string }[];
  sizes: string[];
  stockPerVariant?: number;
};

const PRODUCTS: SeedProduct[] = [
  // Кроссовки
  { slug: "berry-run-classic", name: "Кроссовки Berry Run Classic", description: "Лёгкие беговые кроссовки с амортизирующей подошвой и дышащим верхом из сетки. Подходят для города и лёгких тренировок.\n\n• Верх: текстиль\n• Подошва: EVA\n• Сезон: лето/демисезон", category: "sneakers", gender: "UNISEX", priceRub: 5990, discountPercent: 15, emoji: "👟", gradient: ["#0f766e", "#34d399"], colors: [{ name: "Белый", hex: "#f4f4f5" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["38", "39", "40", "41", "42", "43", "44"] },
  { slug: "berry-street-w", name: "Кроссовки Berry Street женские", description: "Городские кроссовки на массивной подошве. Мягкая стелька и усиленный задник держат стопу весь день.\n\n• Верх: экокожа\n• Подошва: резина\n• Высота подошвы: 4 см", category: "sneakers", gender: "WOMEN", priceRub: 6990, discountPercent: 25, emoji: "👟", gradient: ["#be185d", "#f472b6"], colors: [{ name: "Белый", hex: "#f4f4f5" }, { name: "Розовый", hex: "#f9a8d4" }], sizes: ["36", "37", "38", "39", "40"] },
  { slug: "berry-flex-m", name: "Кроссовки Berry Flex мужские", description: "Тренировочные кроссовки с гибкой подошвой и боковой поддержкой. Для зала и улицы.\n\n• Верх: сетка + синтетика\n• Подошва: резина с протектором", category: "sneakers", gender: "MEN", priceRub: 7490, emoji: "👟", gradient: ["#1e3a8a", "#60a5fa"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Синий", hex: "#3b82f6" }], sizes: ["40", "41", "42", "43", "44", "45"] },
  { slug: "berry-retro-90", name: "Кроссовки Berry Retro '90", description: "Ретро-силуэт из 90-х: замшевые вставки, контрастные панели и рифлёная подошва.\n\n• Верх: замша/текстиль\n• Подошва: резина", category: "sneakers", gender: "UNISEX", priceRub: 8990, discountPercent: 10, emoji: "👟", gradient: ["#7c2d12", "#fb923c"], colors: [{ name: "Бежевый", hex: "#d6c7b0" }, { name: "Серый", hex: "#9ca3af" }], sizes: ["38", "39", "40", "41", "42", "43"] },
  // Обувь
  { slug: "berry-chelsea-w", name: "Ботинки челси женские Berry", description: "Классические челси на устойчивом каблуке с эластичными вставками. Утеплённая подкладка для прохладной погоды.\n\n• Верх: натуральная кожа\n• Подкладка: байка", category: "shoes", gender: "WOMEN", priceRub: 10990, discountPercent: 30, emoji: "👢", gradient: ["#3f3f46", "#a1a1aa"], colors: [{ name: "Чёрный", hex: "#27272a" }], sizes: ["36", "37", "38", "39", "40"] },
  { slug: "berry-derby-m", name: "Туфли дерби мужские Berry", description: "Строгие дерби из гладкой кожи на тонкой подошве. Для офиса и торжественных случаев.\n\n• Верх: натуральная кожа\n• Подошва: кожа с профилактикой", category: "shoes", gender: "MEN", priceRub: 12990, emoji: "👞", gradient: ["#44403c", "#a8a29e"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Коричневый", hex: "#78350f" }], sizes: ["40", "41", "42", "43", "44"] },
  { slug: "berry-sandals-w", name: "Босоножки Berry Summer", description: "Лёгкие босоножки на плоском ходу с мягкими ремешками. Идеальны для жаркой погоды.\n\n• Верх: экокожа\n• Подошва: полиуретан", category: "shoes", gender: "WOMEN", priceRub: 4590, discountPercent: 20, emoji: "👡", gradient: ["#b45309", "#fcd34d"], colors: [{ name: "Бежевый", hex: "#d6c7b0" }, { name: "Белый", hex: "#f4f4f5" }], sizes: ["36", "37", "38", "39"] },
  { slug: "berry-loafers-m", name: "Лоферы мужские Berry Soft", description: "Мягкие лоферы из нубука на гибкой подошве. Комфорт городского ритма без шнурков.\n\n• Верх: нубук\n• Подошва: резина", category: "shoes", gender: "MEN", priceRub: 9490, emoji: "🥿", gradient: ["#365314", "#a3e635"], colors: [{ name: "Коричневый", hex: "#78350f" }, { name: "Тёмно-синий", hex: "#1e3a8a" }], sizes: ["40", "41", "42", "43", "44"] },
  // Одежда
  { slug: "berry-hoodie", name: "Худи оверсайз Styleberries", description: "Плотное худи свободного кроя с начёсом внутри. Капюшон на шнурке, карман-кенгуру.\n\n• Состав: 80% хлопок, 20% полиэстер\n• Плотность: 340 г/м²", category: "clothing", gender: "UNISEX", priceRub: 3990, discountPercent: 20, emoji: "🧥", gradient: ["#065f46", "#6ee7b7"], colors: [{ name: "Зелёный", hex: "#059669" }, { name: "Чёрный", hex: "#27272a" }, { name: "Серый", hex: "#9ca3af" }], sizes: ["XS", "S", "M", "L", "XL"] },
  { slug: "berry-tshirt-basic", name: "Футболка базовая Berry", description: "Базовая футболка из плотного хлопка. Прямой крой, укреплённая горловина, без принта.\n\n• Состав: 100% хлопок\n• Плотность: 190 г/м²", category: "clothing", gender: "UNISEX", priceRub: 1490, emoji: "👕", gradient: ["#0e7490", "#67e8f9"], colors: [{ name: "Белый", hex: "#f4f4f5" }, { name: "Чёрный", hex: "#27272a" }, { name: "Зелёный", hex: "#059669" }], sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { slug: "berry-dress-midi", name: "Платье миди Berry Bloom", description: "Струящееся платье миди с цветочным настроением: приталенный силуэт, юбка полусолнце.\n\n• Состав: вискоза\n• Длина: миди", category: "clothing", gender: "WOMEN", priceRub: 5490, discountPercent: 15, emoji: "👗", gradient: ["#9d174d", "#f9a8d4"], colors: [{ name: "Розовый", hex: "#f9a8d4" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["XS", "S", "M", "L"] },
  { slug: "berry-jeans-m", name: "Джинсы прямые мужские Berry", description: "Классические прямые джинсы средней посадки из плотного денима с лёгким эффектом потёртости.\n\n• Состав: 99% хлопок, 1% эластан", category: "clothing", gender: "MEN", priceRub: 4990, emoji: "👖", gradient: ["#1e40af", "#93c5fd"], colors: [{ name: "Синий", hex: "#3b82f6" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["S", "M", "L", "XL", "XXL"] },
  { slug: "berry-puffer-w", name: "Куртка стёганая женская Berry Warm", description: "Утеплённая стёганая куртка с высоким воротником и скрытым капюшоном. Ветро- и влагозащита.\n\n• Утеплитель: синтепух 200 г\n• Температура: до −10°C", category: "clothing", gender: "WOMEN", priceRub: 8990, discountPercent: 25, emoji: "🧥", gradient: ["#581c87", "#c084fc"], colors: [{ name: "Фиолетовый", hex: "#a855f7" }, { name: "Чёрный", hex: "#27272a" }], sizes: ["XS", "S", "M", "L", "XL"] },
  { slug: "berry-shirt-m", name: "Рубашка оксфорд мужская Berry", description: "Рубашка из ткани оксфорд с воротником button-down. Слегка свободный крой, подходит и к джинсам, и к брюкам.\n\n• Состав: 100% хлопок", category: "clothing", gender: "MEN", priceRub: 3490, emoji: "👔", gradient: ["#155e75", "#7dd3fc"], colors: [{ name: "Голубой", hex: "#7dd3fc" }, { name: "Белый", hex: "#f4f4f5" }], sizes: ["S", "M", "L", "XL"] },
  { slug: "berry-leggings-w", name: "Леггинсы спортивные Berry Move", description: "Леггинсы с высокой талией и утягивающим эффектом. Не просвечивают, быстро сохнут.\n\n• Состав: 75% нейлон, 25% эластан", category: "clothing", gender: "WOMEN", priceRub: 2490, discountPercent: 10, emoji: "🩳", gradient: ["#166534", "#86efac"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Зелёный", hex: "#059669" }], sizes: ["XS", "S", "M", "L"] },
  { slug: "berry-cap", name: "Кепка Berry Logo", description: "Шестипанельная кепка с вышитым логотипом-ягодой. Регулируемый ремешок сзади.\n\n• Состав: 100% хлопок", category: "clothing", gender: "UNISEX", priceRub: 1290, emoji: "🧢", gradient: ["#831843", "#fb7185"], colors: [{ name: "Чёрный", hex: "#27272a" }, { name: "Зелёный", hex: "#059669" }], sizes: ["ONE SIZE"] },
];

async function main() {
  console.log("Seeding…");

  // Категории
  const categories = [
    { slug: "sneakers", name: "Кроссовки", sort: 1 },
    { slug: "shoes", name: "Обувь", sort: 2 },
    { slug: "clothing", name: "Одежда", sort: 3 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const catBySlug = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  // Пользователи
  const admin = await prisma.user.upsert({
    where: { email: "admin@styleberries.example" },
    update: {},
    create: {
      email: "admin@styleberries.example",
      name: "Администратор",
      passwordHash: await bcrypt.hash("admin123", 10),
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
    const imageUrl = makeImage(p.slug, p.name, p.emoji, p.gradient[0], p.gradient[1]);
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        categoryId: catBySlug[p.category],
        gender: p.gender,
        basePrice: p.priceRub * 100,
        discountPercent: p.discountPercent ?? 0,
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
  console.log(`  Админ:      admin@styleberries.example / admin123`);
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

// Все суммы в системе хранятся в копейках (целые числа) —
// это исключает ошибки округления с плавающей точкой.

export function formatPrice(kopecks: number): string {
  const rubles = Math.round(kopecks) / 100;
  return (
    new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: rubles % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(rubles) + " ₽"
  );
}

/** Цена товара с учётом его постоянной скидки. */
export function discountedPrice(basePrice: number, discountPercent: number): number {
  if (discountPercent <= 0) return basePrice;
  return Math.round((basePrice * (100 - discountPercent)) / 100);
}

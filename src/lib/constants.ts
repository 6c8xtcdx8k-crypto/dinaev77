export const ORDER_STATUSES = [
  "NEW",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Ожидает оплаты",
  PAID: "Оплачен",
  PROCESSING: "В сборке",
  SHIPPED: "Передан в доставку",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

// Допустимые переходы статусов (простая state machine).
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// Статусы заказа, считающиеся «активной доставкой» в кабинете.
export const ACTIVE_DELIVERY_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED"];

export const GENDERS = ["WOMEN", "MEN", "UNISEX"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  WOMEN: "Женская",
  MEN: "Мужская",
  UNISEX: "Унисекс",
};

// Доставка только через СДЭК и только за счёт покупателя:
// тариф СДЭК в сумму заказа не входит и оплачивается при получении.
export const DELIVERY_METHODS = {
  CDEK: { label: "СДЭК (пункт выдачи)", cost: 0 },
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_METHODS;

// Зоны доставки СДЭК по России. Стоимость (копейки) — ориентир для посылки
// ~0.5–1 кг до пункта выдачи. Когда подключат CDEK API — цены станут точными.
// Ориентировочные розничные тарифы СДЭК от Москвы (Садовод) до пункта выдачи
// для посылки уровня «обувная коробка» ~0.5–1 кг (тариф «Посылочка», 2026).
export const DELIVERY_ZONES = [
  { id: "msk", label: "Москва и область", cost: 30000 },
  { id: "spb", label: "Санкт-Петербург и область", cost: 35000 },
  { id: "center", label: "Центр, Северо-Запад, Юг России", cost: 40000 },
  { id: "volga_ural", label: "Поволжье, Урал", cost: 50000 },
  { id: "siberia", label: "Сибирь", cost: 60000 },
  { id: "far", label: "Дальний Восток, Крайний Север", cost: 75000 },
] as const;

export type DeliveryZoneId = (typeof DELIVERY_ZONES)[number]["id"];

/** Бесплатная доставка при сумме заказа от этого порога (копейки) = 10 000 ₽. */
export const FREE_DELIVERY_FROM = 1_000_000;

export function deliveryZoneCost(id: string | undefined): number {
  return DELIVERY_ZONES.find((z) => z.id === id)?.cost ?? 0;
}

export const SORT_OPTIONS = [
  { value: "new", label: "Сначала новинки" },
  { value: "popular", label: "По популярности" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating", label: "По рейтингу" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const CATALOG_PAGE_SIZE = 12;

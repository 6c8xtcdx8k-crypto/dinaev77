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

export const SORT_OPTIONS = [
  { value: "new", label: "Сначала новинки" },
  { value: "popular", label: "По популярности" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating", label: "По рейтингу" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const CATALOG_PAGE_SIZE = 12;

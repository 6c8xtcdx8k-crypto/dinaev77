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
  NEW: "Новый",
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

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "REFUNDED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "На рассмотрении",
  APPROVED: "Одобрен, ждём товар",
  REJECTED: "Отклонён",
  REFUNDED: "Деньги возвращены",
};

export const RETURN_STATUS_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["REFUNDED", "REJECTED"],
  REJECTED: [],
  REFUNDED: [],
};

export const RETURN_REASONS = [
  "Не подошёл размер",
  "Не соответствует описанию",
  "Брак или повреждение",
  "Передумал(а)",
] as const;

export const GENDERS = ["WOMEN", "MEN", "UNISEX"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  WOMEN: "Женщинам",
  MEN: "Мужчинам",
  UNISEX: "Унисекс",
};

export const DELIVERY_METHODS = {
  COURIER: { label: "Курьером до двери", cost: 39900, freeFrom: 500000 },
  PICKUP: { label: "Пункт выдачи Styleberries", cost: 0, freeFrom: 0 },
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_METHODS;

export const SORT_OPTIONS = [
  { value: "popular", label: "По популярности" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "new", label: "Новинки" },
  { value: "discount", label: "По размеру скидки" },
  { value: "rating", label: "По рейтингу" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const CATALOG_PAGE_SIZE = 12;

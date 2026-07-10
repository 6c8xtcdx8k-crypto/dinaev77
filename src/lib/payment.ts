/**
 * Платёжные реквизиты магазина. Реквизиты публичные (их видит каждый
 * покупатель), поэтому ссылка для перевода зашита значением по умолчанию;
 * окружение (.env) переопределяет её при необходимости.
 * Два способа: USDT (TRC-20) и перевод на карту банка. У каждого — QR-код.
 */
export type PaymentMethod = {
  key: "usdt" | "card";
  title: string;
  label: string; // подпись над значением
  value: string; // адрес кошелька / номер карты / ссылка на перевод
  qrData: string; // что зашито в QR
};

/** Платёжная ссылка Т-Банка для перевода на карту (в ней же QR). */
const DEFAULT_CARD_QR = "https://tbank.ru/cf/2lpzxBl3uEn";

export function getPaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

  const usdt = process.env.PAYMENT_USDT_TRC20?.trim();
  if (usdt) {
    methods.push({
      key: "usdt",
      title: "USDT (сеть TRC-20)",
      label: "Кошелёк USDT TRC-20",
      value: usdt,
      qrData: usdt,
    });
  }

  // В QR кладём платёжную ссылку банка; номер карты — если задан в .env.
  const card = process.env.PAYMENT_CARD?.trim();
  const cardQr = process.env.PAYMENT_CARD_QR?.trim() || DEFAULT_CARD_QR;
  methods.push({
    key: "card",
    title: "Перевод на карту",
    label: card ? "Номер карты" : "Ссылка для перевода (Т-Банк)",
    value: card || cardQr,
    qrData: cardQr,
  });

  return methods;
}

/** URL картинки с QR-кодом (обслуживается /api/qr). */
export function qrUrlFor(data: string, baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ""): string {
  return `${baseUrl}/api/qr?data=${encodeURIComponent(data)}`;
}

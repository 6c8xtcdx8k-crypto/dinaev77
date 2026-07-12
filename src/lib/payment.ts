/**
 * Платёжные реквизиты магазина. Реквизиты публичные (их видит каждый
 * покупатель), поэтому ссылка для перевода зашита значением по умолчанию;
 * окружение (.env) переопределяет её при необходимости.
 * Способ оплаты: перевод на карту банка, с QR-кодом.
 */
export type PaymentMethod = {
  key: "card";
  title: string;
  label: string; // подпись над значением
  value: string; // номер карты / ссылка на перевод
  qrData: string; // что зашито в QR
};

/** Платёжная ссылка Т-Банка для перевода на карту (в ней же QR). */
const DEFAULT_CARD_QR = "https://tbank.ru/cf/2lpzxBl3uEn";

export function getPaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

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

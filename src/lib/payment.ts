/**
 * Платёжные реквизиты магазина. Задаются через окружение — в код не пишутся.
 * Два способа: USDT (TRC-20) и перевод на карту банка. У каждого — QR-код.
 */
export type PaymentMethod = {
  key: "usdt" | "card";
  title: string;
  label: string; // подпись над значением
  value: string; // адрес кошелька / номер карты
  qrData: string; // что зашито в QR
};

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

  const card = process.env.PAYMENT_CARD?.trim();
  if (card) {
    // В QR кладём платёжную ссылку банка (если задана PAYMENT_CARD_QR),
    // иначе — сам номер карты.
    const cardQr = process.env.PAYMENT_CARD_QR?.trim() || card;
    methods.push({
      key: "card",
      title: "Перевод на карту",
      label: "Номер карты",
      value: card,
      qrData: cardQr,
    });
  }

  return methods;
}

export function getPaymentInfo() {
  const methods = getPaymentMethods();
  return { methods, configured: methods.length > 0 };
}

/** URL картинки с QR-кодом (обслуживается /api/qr). */
export function qrUrlFor(data: string, baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ""): string {
  return `${baseUrl}/api/qr?data=${encodeURIComponent(data)}`;
}

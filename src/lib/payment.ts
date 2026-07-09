/**
 * Платёжные реквизиты магазина. Задаются через окружение — в код не пишутся.
 * Оплата: USDT в сети TRC-20 (кошелёк + QR-код).
 */
export function getPaymentInfo() {
  const usdtTrc20 = process.env.PAYMENT_USDT_TRC20?.trim() || "";
  return {
    usdtTrc20,
    configured: usdtTrc20.length > 0,
  };
}

/** URL картинки с QR-кодом кошелька (обслуживается /api/qr). */
export function qrUrlFor(data: string, baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ""): string {
  return `${baseUrl}/api/qr?data=${encodeURIComponent(data)}`;
}

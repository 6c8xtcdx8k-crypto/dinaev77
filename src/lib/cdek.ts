import "server-only";

/**
 * Клиент CDEK API v2: авторизация (с кешем токена), поиск городов,
 * пунктов выдачи и расчёт тарифа доставки.
 *
 * По умолчанию используются ТЕСТОВЫЕ ключи и тестовый контур CDEK —
 * тарифы там демонстрационные. Для боевых цен задайте в переменных окружения:
 *   CDEK_BASE=https://api.cdek.ru/v2
 *   CDEK_ACCOUNT=<боевой account из личного кабинета CDEK>
 *   CDEK_SECRET=<боевой secret>
 *   CDEK_SENDER_CITY_CODE=<код города-отправителя, Москва = 44>
 */
const BASE = process.env.CDEK_BASE || "https://api.edu.cdek.ru/v2";
const ACCOUNT = process.env.CDEK_ACCOUNT || "EMscd6r9JnFiQ3bLoyjJY6eM78JrJceI";
const SECRET = process.env.CDEK_SECRET || "PjLZkKBHEiLK3YsjtNrt3TGNG0ahs3kG";

/** Город-отправитель (склад магазина). Москва = 44. */
export const CDEK_SENDER_CITY = Number(process.env.CDEK_SENDER_CITY_CODE || 44);

let tokenCache: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now()) return tokenCache.token;
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: ACCOUNT,
      client_secret: SECRET,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`CDEK auth ${res.status}`);
  const j = await res.json();
  tokenCache = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return tokenCache.token;
}

async function api(path: string, init?: RequestInit) {
  const t = await token();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`CDEK ${path} ${res.status}`);
  return res.json();
}

export type CdekCity = { code: number; city: string; region: string };

/** Поиск городов по названию (для автоподсказки). */
export async function cdekCities(q: string): Promise<CdekCity[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const data = await api(
    `/location/cities?country_codes=RU&size=8&city=${encodeURIComponent(query)}`,
  );
  return (Array.isArray(data) ? data : []).map((c: Record<string, unknown>) => ({
    code: Number(c.code),
    city: String(c.city ?? ""),
    region: String(c.region ?? ""),
  }));
}

export type CdekPoint = { code: string; name: string; address: string };

/** Пункты выдачи в городе. */
export async function cdekPoints(cityCode: number): Promise<CdekPoint[]> {
  const data = await api(
    `/deliverypoints?city_code=${cityCode}&type=PVZ&country_code=RU&size=48`,
  );
  return (Array.isArray(data) ? data : []).map((p: Record<string, any>) => ({
    code: String(p.code),
    name: String(p.name ?? p.code),
    address: String(p.location?.address_full || p.location?.address || ""),
  }));
}

export type CdekTariff = { cost: number; termMin: number; termMax: number };

/**
 * Расчёт стоимости доставки (рубли) и срока (дни).
 * toDoor=true — курьером до двери (тариф 137), иначе до пункта выдачи (136).
 */
export async function cdekCalc(opts: {
  toCity: number;
  weightGr: number;
  toDoor?: boolean;
}): Promise<CdekTariff | null> {
  const body = {
    tariff_code: opts.toDoor ? 137 : 136,
    from_location: { code: CDEK_SENDER_CITY },
    to_location: { code: opts.toCity },
    packages: [{ weight: Math.max(100, Math.round(opts.weightGr)) }],
  };
  const data = await api(`/calculator/tariff`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data?.total_sum == null) return null;
  return {
    cost: Math.round(Number(data.total_sum)),
    termMin: Number(data.period_min ?? 0),
    termMax: Number(data.period_max ?? 0),
  };
}

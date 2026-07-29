/**
 * Нагрузочный тест магазина. Гонит параллельные запросы к читающим (кэшируемым)
 * страницам и показывает RPS, задержки (p50/p95/p99) и ошибки — чтобы увидеть
 * реальный потолок и где рвётся.
 *
 * Запуск:
 *   node scripts/loadtest.mjs <BASE_URL> [concurrency] [seconds]
 * Пример:
 *   node scripts/loadtest.mjs https://ваш-домен 100 30
 *
 * ⚠️ Тестирует ТОЛЬКО чтение (каталог/главная/API) — заказы и вход не трогает.
 * Начинайте с небольшой нагрузки (50–100) и повышайте постепенно.
 */

const BASE = (process.argv[2] || "").replace(/\/$/, "");
const CONCURRENCY = Number(process.argv[3]) || 50;
const SECONDS = Number(process.argv[4]) || 20;

if (!BASE) {
  console.error("Укажите URL: node scripts/loadtest.mjs https://ваш-домен 100 30");
  process.exit(1);
}

// Читающие пути под нагрузку (кэшируемые). Вес — сколько раз встречается.
const PATHS = [
  "/",
  "/catalog",
  "/catalog?category=shoes",
  "/catalog?category=clothing",
  "/api/catalog?page=1&category=shoes",
  "/api/catalog?page=2",
];

const lat = [];
let ok = 0;
let fail = 0;
const codes = {};
let stop = false;

function pick() {
  return PATHS[(Math.random() * PATHS.length) | 0];
}

async function worker() {
  while (!stop) {
    const url = BASE + pick();
    const t0 = performance.now();
    try {
      const res = await fetch(url, { headers: { "user-agent": "styleberries-loadtest" } });
      // читаем тело, чтобы измерить полную обработку
      await res.arrayBuffer();
      const ms = performance.now() - t0;
      lat.push(ms);
      codes[res.status] = (codes[res.status] || 0) + 1;
      if (res.ok) ok++;
      else fail++;
    } catch {
      fail++;
      codes["ERR"] = (codes["ERR"] || 0) + 1;
    }
  }
}

function pct(arr, p) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

console.log(`Нагрузка на ${BASE}: ${CONCURRENCY} параллельных, ${SECONDS} c\n`);
const start = Date.now();
const workers = Array.from({ length: CONCURRENCY }, () => worker());
setTimeout(() => (stop = true), SECONDS * 1000);
await Promise.all(workers);

const total = ok + fail;
const secs = (Date.now() - start) / 1000;
console.log("─".repeat(46));
console.log(`Всего запросов:   ${total}`);
console.log(`Успешных (2xx):   ${ok}`);
console.log(`Ошибок/не-2xx:    ${fail}`);
console.log(`RPS (запросов/с): ${(total / secs).toFixed(1)}`);
console.log("Задержки, мс:");
console.log(`  p50: ${pct(lat, 50).toFixed(0)}  p95: ${pct(lat, 95).toFixed(0)}  p99: ${pct(lat, 99).toFixed(0)}  max: ${Math.max(0, ...lat).toFixed(0)}`);
console.log("Коды ответов:    ", JSON.stringify(codes));
console.log("─".repeat(46));
if (fail / Math.max(1, total) > 0.01) {
  console.log("⚠️  Более 1% ошибок — вероятно, достигнут потолок. Снизьте нагрузку или масштабируйте базу/план.");
} else {
  console.log("✓ Ошибок почти нет — можно поднять concurrency и повторить, чтобы найти предел.");
}

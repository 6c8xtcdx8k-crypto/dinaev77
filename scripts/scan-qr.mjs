/** Сканирует все фото товаров каналов на QR-коды (визитки поставщиков). */
import { readFileSync, writeFileSync } from "fs";
import sharp from "sharp";
import jsQR from "jsqr";

const items = JSON.parse(readFileSync("scripts/channel-products.json", "utf8"));
const urls = new Map(); // url -> [slugs]
for (const p of items) {
  for (const u of p.photos) {
    if (!urls.has(u)) urls.set(u, []);
    urls.get(u).push(p.slug);
  }
}
console.log("товаров:", items.length, "| уникальных фото:", urls.size);

const banned = [];
let done = 0;
const list = [...urls.keys()];

async function hasQr(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    // два масштаба: маленький ловит крупные QR, большой — мелкие
    for (const width of [500, 900]) {
      const { data, info } = await sharp(buf)
        .resize({ width, withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height);
      if (code && code.data) return code.data;
    }
    return false;
  } catch {
    return false;
  }
}

const CONC = 10;
for (let i = 0; i < list.length; i += CONC) {
  await Promise.all(
    list.slice(i, i + CONC).map(async (u) => {
      const qr = await hasQr(u);
      if (qr) {
        banned.push(u);
        console.log("QR:", String(qr).slice(0, 60), "| у товаров:", urls.get(u).join(", "));
      }
    }),
  );
  done += CONC;
  if (done % 300 < CONC) process.stderr.write(`${Math.min(done, list.length)}/${list.length}\n`);
}

writeFileSync("scripts/banned-photos.json", JSON.stringify(banned, null, 1));
console.log("фото с QR-кодами:", banned.length);

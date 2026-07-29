import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Автономная сборка для Docker: .next/standalone содержит сервер
  // и только нужные node_modules.
  output: "standalone",

  // Prisma + serverless-драйвер Neon подключаем в рантайме из node_modules,
  // а не бандлим в сборку (рекомендация Prisma для driver adapters).
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless", "ws"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Не даём браузеру угадывать типы файлов
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Не отдаём полный URL сторонним сайтам
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Отключаем ненужные API браузера
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Ограничиваем, откуда грузятся скрипты/стили/картинки/видео (защита от XSS
          // и подмешивания стороннего кода). Разрешено ровно то, что нужно магазину:
          //  - inline-скрипты Next.js (гидрация) и SDK Telegram (telegram.org);
          //  - inline-стили (Tailwind);
          //  - картинки и видео товаров с любых https-хостов (Cloudinary, Telegram CDN, Blob);
          //  - фреймы — только Telegram (веб-версии открывают Mini App в iframe).
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "form-action 'self'",
              "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
              "frame-src 'self'",
              "script-src 'self' 'unsafe-inline' https://telegram.org",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://telegram.org",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          // Всегда HTTPS (актуально за Caddy)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

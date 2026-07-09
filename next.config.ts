import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Автономная сборка для Docker: .next/standalone содержит сервер
  // и только нужные node_modules.
  output: "standalone",

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
          // Встраивание во фреймы — только Telegram (веб-версии открывают Mini App в iframe)
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
          },
          // Всегда HTTPS (актуально за Caddy)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

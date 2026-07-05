import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Автономная сборка для Docker: .next/standalone содержит сервер
  // и только нужные node_modules.
  output: "standalone",
};

export default nextConfig;

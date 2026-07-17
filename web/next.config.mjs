/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-lib / qrcode виносимо з бандла (потрібно для генерації PDF-сертифіката).
  // Ключ під Next 14. (У Next 15+ він називається serverExternalPackages.)
  experimental: {
    serverComponentsExternalPackages: ["pdf-lib", "qrcode"],
  },
};

export default nextConfig;

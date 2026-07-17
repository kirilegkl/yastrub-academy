/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-lib / qrcode work fine in the Node.js runtime; certificate routes force node runtime.
  // Next 15+: renamed from experimental.serverComponentsExternalPackages.
  serverExternalPackages: ["pdf-lib", "qrcode"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 将原生模块及其核心加载包完整标记为外部，以防 nft 追踪失败
  serverExternalPackages: ["better-sqlite3", "bindings", "file-uri-to-path"],
};

export default nextConfig;

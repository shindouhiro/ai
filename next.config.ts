import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  output: 'standalone',
  // 核心强制配置：在 webpack 层面将 better-sqlite3 剥离，不进入 chunk
  serverExternalPackages: ["better-sqlite3", "bindings"],
  webpack: (config, { isServer }) => {
    if (isServer) {
        config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};
 
export default nextConfig;

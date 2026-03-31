import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  output: 'standalone',
  // 核心强制配置：在服务端排除原生模块。确保它们在渲染时不被捆绑。
  serverExternalPackages: ["better-sqlite3", "bindings", "file-uri-to-path"],
  webpack: (config, { isServer }) => {
    if (isServer) {
        // 增加 bindings / file-uri-to-path 为外部，以防 nft 追踪失败
        config.externals = [
          ...(config.externals || []), 
          'better-sqlite3', 
          'bindings', 
          'file-uri-to-path'
        ];
    }
    return config;
  },
};
 
export default nextConfig;

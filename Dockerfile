# 阶段 1: 基础环境（含编译工具）
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 阶段 2: 构建应用
FROM base AS builder
WORKDIR /app
# 先拷贝依赖描述文件，充分利用 Docker 构建缓存
# 只要 package.json / lockfile 没变，pnpm install 层就会被缓存跳过
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
# 在当前 Linux x64 / Node.js v20 环境重新编译原生模块
RUN pnpm rebuild better-sqlite3
# 再拷贝源码（源码变更不会使上面的缓存失效）
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# 阶段 3: 生产运行（精简镜像）
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 拷贝 Next.js standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# standalone 的 nft 会跳过 .node 二进制文件，必须手动补全
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

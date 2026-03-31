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

# 阶段 2: 构建应用（使用全量镜像以保证构建期 worker 的稳定性）
FROM node:20 AS builder
WORKDIR /app
# 使用 ENV key=value 格式
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_CPU_COUNT=1
# 增加内存限制，防止 Worker 在构建期间崩溃
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm rebuild better-sqlite3

COPY . .
# 强制使用 Webpack 编译器，避免 Turbopack 自动探测导致的逻辑冲突
RUN npx next build --webpack

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

# 关键补丁：手动补全无法被 Next.js nft 完全识别的原生包及其核心加载包
# 特别是 bindings。虽然它是 JS，但在作为外部包被调用时，必须物理存在于 node_modules 中。
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

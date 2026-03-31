# 阶段 1: 基础环境（含编译工具）
FROM node:20 AS base
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
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_CPU_COUNT=1
# 提供充足内存给 Next.js Worker
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
# 在当前 Linux x64 环境重新编译，生成符合当前 ABI (v115) 的 .node 文件
RUN pnpm rebuild better-sqlite3

COPY . .
# 强制使用 webpack
RUN npx next build --webpack

# 阶段 3: 生产运行（使用全量镜像以保证二进制库的完整性）
FROM node:20 AS runner
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

# 手动补全原生包。即使是全量镜像， standalone 模式依然可能在路径解析上存在瑕疵。
# 必须物理存在于 node_modules，因为我们已经在 webpack 层面将其设为 external。
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

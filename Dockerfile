# ── WEEKLY//UNI — multi-stage build (bun deps/build + node runtime) ─────

# 1) deps ---------------------------------------------------------------
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2) builder ------------------------------------------------------------
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# next.config.ts has output:"standalone"; package.json build copies static+public into it
RUN bun run build

# 3) runner -------------------------------------------------------------
# Node runtime for next standalone (battle-tested; bun kept for deps/build)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DB_PATH=/app/data/db.json

# persistent JSON database — mount a Railway Volume here so data survives redeploys
# (db self-seeds on first request if the file is missing — src/lib/db.ts)
RUN mkdir -p /app/data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

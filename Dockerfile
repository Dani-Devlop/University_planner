# ── WEEKLY//UNI — multi-stage build (bun + next standalone) ─────────────

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
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DB_PATH=/app/data/db.json

# persistent JSON database — mount a Railway Volume here so data survives redeploys
RUN mkdir -p /app/data
VOLUME ["/app/data"]

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/data/db.json /app/data/db.json

EXPOSE 3000
CMD ["bun", "server.js"]

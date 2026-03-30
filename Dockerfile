# =============================================================================
# Stage 1: Install dependencies
# =============================================================================
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

# Copy lockfile and package manifest only — maximises Docker layer cache
COPY package.json package-lock.json ./

RUN npm ci

# =============================================================================
# Stage 2: Build the Next.js application
# =============================================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ─── NEXT_PUBLIC_* build arguments ───────────────────────────────────────────
# NEXT_PUBLIC_* vars are inlined into the JS bundle at build time by webpack.
# They MUST be declared as ARG then promoted to ENV before `next build` runs.
# Changing these values requires rebuilding the image (`docker compose build itsm-frontend`).
ARG NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_SUPABASE_URL_TAILSCALE=
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
ARG NEXT_PUBLIC_API_BASE_URL_TAILSCALE=

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL_TAILSCALE=$NEXT_PUBLIC_SUPABASE_URL_TAILSCALE
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL_TAILSCALE=$NEXT_PUBLIC_API_BASE_URL_TAILSCALE

ENV NEXT_TELEMETRY_DISABLED=1

# output: 'standalone' in next.config.ts produces .next/standalone with a
# self-contained server bundle — no node_modules needed at runtime
RUN npm run build

# =============================================================================
# Stage 3: Production runtime image (~150 MB)
# =============================================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache ca-certificates

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user (mirrors Dockerfile.api pattern)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what the standalone server needs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

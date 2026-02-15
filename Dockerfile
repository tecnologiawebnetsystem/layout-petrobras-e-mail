# ============================================================
# Dockerfile - Frontend Next.js 16
# Multi-stage build para producao
# ============================================================

# ---------- STAGE 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar .npmrc se existir (para Nexus corporativo)
# Se nao existir, usa registry padrao (registry.npmjs.org)
COPY .npmrc* ./
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

# Instalar dependencias
# Detecta automaticamente o package manager
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi


# ---------- STAGE 2: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variaveis de build (substituir no build ou via --build-arg)
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_AZURE_CLIENT_ID=
ARG NEXT_PUBLIC_AZURE_TENANT_ID=
ARG NEXT_PUBLIC_AZURE_REDIRECT_URI=

# Build output standalone para container otimizado
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then \
    yarn build; \
  else \
    npm run build; \
  fi


# ---------- STAGE 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criar usuario nao-root para seguranca
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar artefatos do build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

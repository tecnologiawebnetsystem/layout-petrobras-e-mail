# ---------- BUILDER ----------
FROM registry.petrobras.com.br/imagens-devops/base/petro-node22-alpine:snapshot AS builder

WORKDIR /app

# Dependências primeiro
COPY package.json package-lock.json ./
COPY .npmrc .npmrc

RUN npm config set cafile /etc/ssl/certs/ca-certificates.crt \
    && npm ci --no-audit --no-fund

# Código da aplicação
COPY . .

# Build + validação
RUN npm run build \
    && test -f .next/standalone/server.js

# COPY --chown=nextjs:nodejs . .

# ---------- RUNNER ----------
FROM registry.petrobras.com.br/imagens-devops/base/petro-node22-alpine:snapshot AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    BACKEND_URL=https://scac-backend-dsv.petrobras.com.br

# Segurança básica (rodar como usuário não-root)
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copia apenas o necessário
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]

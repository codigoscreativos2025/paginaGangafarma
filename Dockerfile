FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Stage 1: Instalar dependencias
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma necesita una DATABASE_URL dummy para generar el client durante build
ENV DATABASE_URL="file:./db.sqlite"
RUN npx prisma generate
RUN npm run build

# Stage 3: Producción
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

# CRÍTICO: Copiar standalone output + static files + prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Ejecutar prisma db push antes de iniciar (crea tablas si no existen)
CMD ["/bin/sh", "-c", "npx prisma db push --skip-generate && node server.js"]

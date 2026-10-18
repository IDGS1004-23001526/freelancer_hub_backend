# Etapa 1: Construcción (Build)
FROM docker.io/library/node:22-alpine AS builder

WORKDIR /app

# Activar corepack para pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar archivos de definición de dependencias y Prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente y configuración de TypeScript
COPY tsconfig.json ./
COPY src ./src/

# Generar cliente de Prisma, compilar TypeScript a ESM y limpiar devDependencies
RUN pnpm prisma:generate && pnpm build && pnpm prune --prod

# Etapa 2: Producción (Runtime)
FROM docker.io/library/node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]

# KiraPass OS API — production image (Gate 3). Multi-stage, Debian/glibc.
# Node pinned to 22-slim per CTO decision (no repo engines pin existed).

# ---- builder ----
FROM node:22-slim AS builder
WORKDIR /app

# Prisma engine needs OpenSSL on Debian slim.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install deps using the workspace manifests (better layer caching).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

# Copy the rest of the source (node_modules/dist/.env excluded via .dockerignore).
COPY . .

# Generate the Prisma client for THIS (Linux) platform, then build the API.
# A placeholder DATABASE_URL satisfies schema env resolution; generate does not connect.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm run db:generate
RUN npm run build

# ---- runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Built artifacts + installed deps (incl. generated Prisma client + Linux engine).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/package.json ./package.json
COPY startup.sh ./startup.sh

EXPOSE 3000
# startup.sh: prisma migrate deploy + node apps/api/dist/main.js
CMD ["sh", "startup.sh"]

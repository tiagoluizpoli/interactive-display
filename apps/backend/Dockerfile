# Stage 1: Build
FROM node:22-slim AS builder
WORKDIR /app

COPY apps/backend/ ./
RUN yarn install --frozen-lockfile
RUN yarn build

# Stage 2: Production
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

# Instala o Chromium e suas dependências no Alpine
RUN apt update && \
    apt install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm-dev \
    libxkbcommon-dev \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm-dev \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN yarn db:migrate

EXPOSE 5000
CMD ["node", "dist/server.js"]

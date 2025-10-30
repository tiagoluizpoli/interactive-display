# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY apps/backend/ ./
RUN yarn install --frozen-lockfile
RUN yarn build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Instala o Chromium e suas dependências no Alpine
RUN apk update && \
    apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    libstdc++

# Configura as variáveis de ambiente necessárias para o Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]
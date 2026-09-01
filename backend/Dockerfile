# Build stage (Full node:22 has build-essential & python3 for better-sqlite3)
FROM node:22 AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    unzip \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/bin \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /app/bin/yt-dlp \
    && chmod 755 /app/bin/yt-dlp \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data/temp

EXPOSE 10000

CMD ["node", "dist/server.js"]

# Stage 1: Build Frontend
FROM node:22 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend (Full node:22 has build-essential & python3 for better-sqlite3)
FROM node:22 AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json backend/tsconfig.json ./
RUN npm install
COPY backend/src/ ./src/
RUN npm run build

# Stage 3: Production Runner
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

# Install ffmpeg, python3 (for yt-dlp runtime), curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/bin \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /app/bin/yt-dlp \
    && chmod 755 /app/bin/yt-dlp

WORKDIR /app/backend

# Copy compiled backend node_modules from builder to avoid compiling on slim runner
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist /app/public

RUN mkdir -p /app/backend/data/temp

EXPOSE 10000

CMD ["node", "dist/server.js"]

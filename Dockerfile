# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json backend/tsconfig.json ./
RUN npm ci
COPY backend/src/ ./src/
RUN npm run build

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

# Install runtime dependencies: ffmpeg, python3, and curl for yt-dlp
RUN apk add --no-cache ffmpeg python3 curl && \
    mkdir -p /app/bin && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /app/bin/yt-dlp && \
    chmod 755 /app/bin/yt-dlp

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist /app/public

RUN mkdir -p /app/backend/data/temp

EXPOSE 10000

CMD ["node", "dist/server.js"]

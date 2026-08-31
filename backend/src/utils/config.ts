import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
dotenv.config(); // fallback to current working directory .env if present

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  database: {
    path: process.env.DATABASE_PATH || './data/media-downloader.db',
  },

  redis: {
    url: process.env.REDIS_URL || 'memory',
  },

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'changeme-in-production',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },

  security: {
    rateLimitAnalyze: parseInt(process.env.RATE_LIMIT_ANALYZE || '30', 10),
    rateLimitDownload: parseInt(process.env.RATE_LIMIT_DOWNLOAD || '10', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '5', 10),
    maxRequestSizeMb: parseInt(process.env.MAX_REQUEST_SIZE_MB || '1', 10),
  },

  storage: {
    tempDir: process.env.TEMP_DIR || './data/temp',
    tempFileTtlMinutes: parseInt(process.env.TEMP_FILE_TTL_MINUTES || '30', 10),
    cleanupIntervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '5', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

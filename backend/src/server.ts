import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fs from 'fs';
import path from 'path';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { initDatabase, closeDatabase } from './db/connection.js';
import { registerSecurityMiddleware } from './middleware/security.js';
import { registerErrorHandler } from './middleware/errorHandler.js';
import { initAuth } from './middleware/auth.js';
import { mediaRoutes } from './routes/media.js';
import { downloadRoutes } from './routes/downloads.js';
import { platformRoutes } from './routes/platforms.js';
import { adminRoutes } from './routes/admin.js';
import { healthRoutes } from './routes/health.js';
import { cleanupExpiredFiles, ensureTempDir } from './services/cleanup.service.js';

async function main(): Promise<void> {
  // Initialize database
  initDatabase();
  ensureTempDir();
  await initAuth();

  // Create Fastify instance
  const app = Fastify({
    logger: false, // We use our own pino logger
    bodyLimit: config.security.maxRequestSizeMb * 1024 * 1024,
    trustProxy: true,
  });

  // CORS
  await app.register(cors, {
    origin: config.env === 'production'
      ? config.frontendUrl
      : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  // Security middleware
  await registerSecurityMiddleware(app);

  // Error handling
  await registerErrorHandler(app);

  // Request logging
  app.addHook('onResponse', (request, reply, done) => {
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'request completed');
    done();
  });

  // Register routes
  await app.register(mediaRoutes, { prefix: '/api/media' });
  await app.register(downloadRoutes, { prefix: '/api/downloads' });
  await app.register(platformRoutes, { prefix: '/api/platforms' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(healthRoutes, { prefix: '/api/health' });

  // Serve compiled frontend in production if available
  const publicDir = path.resolve(import.meta.dirname, '../public');
  if (fs.existsSync(publicDir)) {
    const fastifyStatic = (await import('@fastify/static')).default;
    await app.register(fastifyStatic, {
      root: publicDir,
      prefix: '/',
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API route not found.' },
      });
    });
  }

  // Cleanup scheduler
  const cleanupInterval = setInterval(() => {
    try {
      cleanupExpiredFiles();
    } catch (err) {
      logger.error({ err }, 'Cleanup failed');
    }
  }, config.storage.cleanupIntervalMinutes * 60 * 1000);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    clearInterval(cleanupInterval);
    await app.close();
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Start server
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info({
      port: config.port,
      env: config.env,
      url: `http://localhost:${config.port}`,
    }, '🚀 Server started');
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

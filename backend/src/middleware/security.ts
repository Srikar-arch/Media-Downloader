import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../utils/config.js';

/**
 * Register security middleware on the Fastify instance.
 */
export async function registerSecurityMiddleware(app: FastifyInstance): Promise<void> {
  // Security headers
  app.addHook('onSend', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    reply.header('X-Download-Options', 'noopen');
    reply.header('X-Permitted-Cross-Domain-Policies', 'none');

    if (config.env === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      reply.header('Content-Security-Policy',
        "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self';"
      );
    }
  });

  // Request size limit
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const contentLength = parseInt(request.headers['content-length'] || '0', 10);
    if (contentLength > config.security.maxRequestSizeMb * 1024 * 1024) {
      reply.code(413).send({
        success: false,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' },
      });
    }
  });
}

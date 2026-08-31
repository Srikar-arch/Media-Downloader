import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * Global error handler for Fastify.
 */
export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Rate limit errors
    if (error.statusCode === 429) {
      reply.code(429).send({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again in a moment.',
        },
      });
      return;
    }

    // Validation errors
    if (error.validation) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Invalid request data.',
        },
      });
      return;
    }

    // Not found
    if (error.statusCode === 404) {
      reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
        },
      });
      return;
    }

    // Log unexpected errors (never expose internals to client)
    logger.error({
      err: error,
      url: request.url,
      method: request.method,
    }, 'Unhandled error');

    reply.code(error.statusCode || 500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
    });
  });

  // 404 handler
  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
  });
}

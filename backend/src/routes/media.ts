import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyzeRequestSchema } from '../utils/urlValidator.js';
import { analyzeUrl } from '../services/media.service.js';

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/media/analyze
   * Analyze a media URL and return metadata + available formats.
   */
  app.post('/analyze', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Please enter a valid media URL.',
        },
      });
    }

    const result = await analyzeUrl(parsed.data.url);
    const statusCode = result.success ? 200 : 400;
    return reply.code(statusCode).send(result);
  });
}

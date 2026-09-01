import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyzeRequestSchema } from '../utils/urlValidator.js';
import { analyzeUrl } from '../services/media.service.js';
import { setYouTubeCookies, getYouTubeCookieStatus } from '../utils/ytdlp.js';
import { z } from 'zod';

const cookiesSchema = z.object({
  cookies: z.string().min(10, 'Cookies content cannot be empty'),
});

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

  /**
   * GET /api/media/cookies/status
   */
  app.get('/cookies/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    const status = getYouTubeCookieStatus();
    return reply.send({ success: true, ...status });
  });

  /**
   * POST /api/media/cookies
   */
  app.post('/cookies', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;
    const parsed = cookiesSchema.safeParse(body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid cookies format.' },
      });
    }

    const success = setYouTubeCookies(parsed.data.cookies);
    if (!success) {
      return reply.code(500).send({ success: false, message: 'Failed to write cookies file.' });
    }

    return reply.send({ success: true, message: 'YouTube session authenticated successfully!' });
  });
}

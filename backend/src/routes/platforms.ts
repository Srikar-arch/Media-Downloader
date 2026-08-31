import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { providerRegistry } from '../providers/registry.js';

export async function platformRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/platforms
   * List all supported platforms and their capabilities.
   */
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const platforms = providerRegistry.listPlatforms();
    return reply.send({
      success: true,
      platforms,
    });
  });
}

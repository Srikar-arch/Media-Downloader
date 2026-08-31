import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}

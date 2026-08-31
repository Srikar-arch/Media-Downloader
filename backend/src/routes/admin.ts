import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateAdmin, adminAuthGuard } from '../middleware/auth.js';
import { adminLoginSchema, paginationSchema } from '../utils/urlValidator.js';
import { getAdminStats, getPaginatedJobs } from '../services/download.service.js';
import { getTempStorageUsage } from '../services/cleanup.service.js';
import { getDatabase } from '../db/connection.js';
import type { SystemEvent } from '../types/index.js';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/admin/login
   */
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid credentials format.' },
      });
    }

    const token = await authenticateAdmin(parsed.data.username, parsed.data.password);
    if (!token) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid username or password.' },
      });
    }

    return reply.send({ success: true, token });
  });

  /**
   * GET /api/admin/stats
   */
  app.get('/stats', { preHandler: adminAuthGuard }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const stats = getAdminStats();
    const storageUsage = getTempStorageUsage();

    return reply.send({
      success: true,
      stats: {
        ...stats,
        systemHealth: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage().heapUsed,
          tempStorageBytes: storageUsage,
          queueLength: stats.activeJobs,
        },
      },
    });
  });

  /**
   * GET /api/admin/jobs
   */
  app.get('/jobs', { preHandler: adminAuthGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, unknown>;
    const parsed = paginationSchema.safeParse(query);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters.' },
      });
    }

    const result = getPaginatedJobs(
      parsed.data.page,
      parsed.data.limit,
      {
        status: parsed.data.status,
        platform: parsed.data.platform,
        search: parsed.data.search,
      },
      parsed.data.sortBy,
      parsed.data.sortOrder
    );

    return reply.send({ success: true, ...result });
  });

  /**
   * GET /api/admin/system
   */
  app.get('/system', { preHandler: adminAuthGuard }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const storageUsage = getTempStorageUsage();
    const mem = process.memoryUsage();

    return reply.send({
      success: true,
      system: {
        uptime: process.uptime(),
        memory: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          rss: mem.rss,
          external: mem.external,
        },
        tempStorage: {
          bytesUsed: storageUsage,
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  });

  /**
   * GET /api/admin/events
   */
  app.get('/events', { preHandler: adminAuthGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, unknown>;
    const limit = Math.min(parseInt(String(query.limit || '50'), 10), 200);

    const db = getDatabase();
    const events = db.prepare(
      'SELECT * FROM system_events ORDER BY created_at DESC LIMIT ?'
    ).all(limit) as SystemEvent[];

    return reply.send({ success: true, events });
  });
}

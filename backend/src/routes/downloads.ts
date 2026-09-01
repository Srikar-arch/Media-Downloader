import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import { createDownloadSchema, jobIdSchema } from '../utils/urlValidator.js';
import { validateUrlSecurity } from '../utils/ssrf.js';
import {
  createDownloadJob,
  getJob,
  cancelJob,
  updateJobStatus,
  jobEvents,
} from '../services/download.service.js';
import { providerRegistry } from '../providers/registry.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { downloadWithYtDlp, killActiveProcess } from '../utils/ytdlp.js';
import type { JobProgressUpdate } from '../types/index.js';

export async function downloadRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/downloads
   * Create a new download job.
   */
  app.post('/', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;
    const parsed = createDownloadSchema.safeParse(body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid request data.',
        },
      });
    }

    // Security check
    const security = validateUrlSecurity(parsed.data.url);
    if (!security.safe) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_URL', message: security.error || 'This URL is not allowed.' },
      });
    }

    const job = createDownloadJob(parsed.data.url, parsed.data.formatId, parsed.data.sessionId);
    if (!job) {
      return reply.code(400).send({
        success: false,
        error: { code: 'JOB_CREATION_FAILED', message: 'Could not create download job.' },
      });
    }

    // Start async download processing
    processDownloadAsync(job.id, parsed.data.url, parsed.data.formatId, parsed.data.mediaTitle).catch(err => {
      logger.error({ err, jobId: job.id }, 'Download processing failed');
    });

    return reply.code(201).send({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
      },
    });
  });

  /**
   * GET /api/downloads/:jobId
   * Get job status.
   */
  app.get('/:jobId', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;
    const parsed = jobIdSchema.safeParse(params);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid job ID.' },
      });
    }

    const job = getJob(parsed.data.jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found.' },
      });
    }

    return reply.send({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        platform: job.platform,
        fileName: job.file_name,
        fileSize: job.file_size,
        mimeType: job.mime_type,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        expiresAt: job.expires_at,
      },
    });
  });

  /**
   * POST /api/downloads/:jobId/cancel
   * Cancel a download job.
   */
  app.post('/:jobId/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;
    const parsed = jobIdSchema.safeParse(params);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid job ID.' },
      });
    }

    killActiveProcess(parsed.data.jobId);
    cancelJob(parsed.data.jobId);

    return reply.send({ success: true, message: 'Job cancelled.' });
  });

  /**
   * GET /api/downloads/:jobId/file
   * Stream the download file.
   */
  app.get('/:jobId/file', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;
    const parsed = jobIdSchema.safeParse(params);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid job ID.' },
      });
    }

    const job = getJob(parsed.data.jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found.' },
      });
    }

    if (job.status !== 'completed' || !job.file_path) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NOT_READY', message: 'Download is not ready yet.' },
      });
    }

    if (!fs.existsSync(job.file_path)) {
      return reply.code(410).send({
        success: false,
        error: { code: 'EXPIRED', message: 'This download has expired.' },
      });
    }

    const stream = fs.createReadStream(job.file_path);
    const fileName = job.file_name || `download.${job.requested_format || 'mp4'}`;

    const origin = (request.headers.origin as string) || '*';
    return reply
      .header('Content-Type', job.mime_type || 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .header('Content-Length', job.file_size || 0)
      .header('Access-Control-Allow-Origin', origin)
      .header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length')
      .send(stream);
  });

  /**
   * GET /api/downloads/:jobId/stream
   * SSE endpoint for real-time job progress.
   */
  app.get('/:jobId/stream', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;
    const parsed = jobIdSchema.safeParse(params);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid job ID.' },
      });
    }

    const jobId = parsed.data.jobId;
    const job = getJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found.' },
      });
    }

    // Set SSE headers
    const origin = (request.headers.origin as string) || '*';
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    });

    // Send current status immediately
    const currentData: JobProgressUpdate = {
      jobId,
      status: job.status as any,
      progress: job.progress,
    };
    reply.raw.write(`data: ${JSON.stringify(currentData)}\n\n`);

    // If already terminal, close
    if (['completed', 'failed', 'cancelled', 'expired'].includes(job.status)) {
      reply.raw.end();
      return;
    }

    // Listen for updates
    const onUpdate = (update: JobProgressUpdate) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(update)}\n\n`);
        if (['completed', 'failed', 'cancelled', 'expired'].includes(update.status)) {
          reply.raw.end();
        }
      } catch {
        // Connection closed
      }
    };

    jobEvents.on(`job:${jobId}`, onUpdate);

    // Cleanup on disconnect
    request.raw.on('close', () => {
      jobEvents.off(`job:${jobId}`, onUpdate);
    });

    // Keep-alive ping every 15 seconds
    const keepAlive = setInterval(() => {
      try {
        reply.raw.write(': keepalive\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(keepAlive);
    });
  });
}

/**
 * Process a download job asynchronously using yt-dlp and ffmpeg.
 */
async function processDownloadAsync(
  jobId: string,
  url: string,
  formatId: string,
  mediaTitle?: string
): Promise<void> {
  try {
    updateJobStatus(jobId, 'analyzing', 15);

    const provider = providerRegistry.detectProvider(url);
    const isDemo = provider && provider.slug === 'demo';

    if (isDemo) {
      // Fast simulation for demo URLs
      updateJobStatus(jobId, 'downloading', 30);
      for (let p = 40; p <= 90; p += 20) {
        await new Promise((r) => setTimeout(r, 200));
        updateJobStatus(jobId, 'downloading', p);
      }

      const tempDir = path.resolve(config.storage.tempDir);
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const ext = formatId.startsWith('audio-') ? (formatId === 'audio-m4a' ? 'm4a' : 'mp3') : 'mp4';
      const filePath = path.join(tempDir, `${jobId}.${ext}`);
      fs.writeFileSync(filePath, Buffer.from(`OmniMedia Demo Video\nJob: ${jobId}\nFormat: ${formatId}\n` + '0'.repeat(1024 * 50)));

      updateJobStatus(jobId, 'completed', 100, {
        file_path: filePath,
        file_name: `demo-${jobId.slice(0, 8)}.${ext}`,
        file_size: 1024 * 50,
        mime_type: ext === 'mp4' ? 'video/mp4' : 'audio/mpeg',
      });
      return;
    }

    // Real download with yt-dlp
    updateJobStatus(jobId, 'downloading', 25);

    const result = await downloadWithYtDlp(
      jobId,
      url,
      formatId,
      mediaTitle,
      (progress, speed, eta) => {
        const job = getJob(jobId);
        if (job && job.status !== 'cancelled') {
          updateJobStatus(jobId, 'downloading', progress);
        }
      }
    );

    updateJobStatus(jobId, 'processing', 98);

    updateJobStatus(jobId, 'completed', 100, {
      file_path: result.filePath,
      file_name: result.fileName,
      file_size: result.fileSize,
      mime_type: result.mimeType,
    });

    logger.info({ jobId, fileSize: result.fileSize, format: formatId }, 'Media download completed successfully');
  } catch (err: any) {
    logger.error({ err, jobId }, 'Download processing error');
    updateJobStatus(jobId, 'failed', 0, {
      error_message: err.message || 'An error occurred while processing the download. Please try again.',
    });
  }
}


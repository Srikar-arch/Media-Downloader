import { nanoid } from 'nanoid';
import { getDatabase } from '../db/connection.js';
import { providerRegistry } from '../providers/registry.js';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import type { DownloadJobRecord, JobStatus, JobProgressUpdate } from '../types/index.js';
import { EventEmitter } from 'events';

// Global event emitter for job progress updates (SSE)
export const jobEvents = new EventEmitter();
jobEvents.setMaxListeners(100);

export function createDownloadJob(
  url: string,
  formatId: string,
  sessionId: string
): DownloadJobRecord | null {
  const provider = providerRegistry.detectProvider(url);
  const platformSlug = provider ? provider.slug : 'web';
  const normalizedUrl = provider ? provider.validate(url).normalizedUrl || url : url;

  const db = getDatabase();
  const id = nanoid(16);
  const expiresAt = new Date(Date.now() + config.storage.tempFileTtlMinutes * 60 * 1000).toISOString();

  const job: DownloadJobRecord = {
    id,
    session_id: sessionId,
    platform: platformSlug,
    source_url: normalizedUrl,
    requested_format: formatId,
    requested_quality: null,
    status: 'queued',
    progress: 0,
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: expiresAt,
    completed_at: null,
  };

  db.prepare(`
    INSERT INTO download_jobs (id, session_id, platform, source_url, requested_format, status, progress, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(job.id, job.session_id, job.platform, job.source_url, job.requested_format, job.status, job.progress, job.expires_at, job.created_at, job.updated_at);

  logger.info({ jobId: id, platform: job.platform, format: formatId }, 'Download job created');

  return job;
}

export function getJob(jobId: string): DownloadJobRecord | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM download_jobs WHERE id = ?').get(jobId) as DownloadJobRecord | undefined;
  return row || null;
}

export function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number = 0,
  extra: Partial<DownloadJobRecord> = {}
): void {
  const db = getDatabase();
  const updates: string[] = ['status = ?', 'progress = ?', 'updated_at = ?'];
  const values: unknown[] = [status, progress, new Date().toISOString()];

  if (extra.file_path) {
    updates.push('file_path = ?');
    values.push(extra.file_path);
  }
  if (extra.file_name) {
    updates.push('file_name = ?');
    values.push(extra.file_name);
  }
  if (extra.file_size !== undefined) {
    updates.push('file_size = ?');
    values.push(extra.file_size);
  }
  if (extra.mime_type) {
    updates.push('mime_type = ?');
    values.push(extra.mime_type);
  }
  if (extra.error_message) {
    updates.push('error_message = ?');
    values.push(extra.error_message);
  }
  if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    updates.push('completed_at = ?');
    values.push(new Date().toISOString());
  }

  values.push(jobId);
  db.prepare(`UPDATE download_jobs SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  // Emit progress event for SSE listeners
  const update: JobProgressUpdate = {
    jobId,
    status,
    progress,
    message: extra.error_message || undefined,
  };
  jobEvents.emit(`job:${jobId}`, update);
}

export function cancelJob(jobId: string): boolean {
  const job = getJob(jobId);
  if (!job) return false;

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled' || job.status === 'expired') {
    return false;
  }

  updateJobStatus(jobId, 'cancelled');
  logger.info({ jobId }, 'Job cancelled');
  return true;
}

export function getJobsBySession(sessionId: string, limit: number = 20): DownloadJobRecord[] {
  const db = getDatabase();
  return db.prepare(
    'SELECT * FROM download_jobs WHERE session_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(sessionId, limit) as DownloadJobRecord[];
}

export function getAdminStats(): {
  totalDownloads: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  platformBreakdown: Record<string, number>;
  recentJobs: DownloadJobRecord[];
} {
  const db = getDatabase();

  const total = (db.prepare('SELECT COUNT(*) as count FROM download_jobs').get() as { count: number }).count;
  const active = (db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status IN ('queued', 'analyzing', 'downloading', 'processing')").get() as { count: number }).count;
  const completed = (db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'completed'").get() as { count: number }).count;
  const failed = (db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'failed'").get() as { count: number }).count;
  const cancelled = (db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'cancelled'").get() as { count: number }).count;

  const platformRows = db.prepare(
    'SELECT platform, COUNT(*) as count FROM download_jobs GROUP BY platform'
  ).all() as Array<{ platform: string; count: number }>;
  const platformBreakdown: Record<string, number> = {};
  platformRows.forEach(row => { platformBreakdown[row.platform] = row.count; });

  const recentJobs = db.prepare(
    'SELECT * FROM download_jobs ORDER BY created_at DESC LIMIT 20'
  ).all() as DownloadJobRecord[];

  return { totalDownloads: total, activeJobs: active, completedJobs: completed, failedJobs: failed, cancelledJobs: cancelled, platformBreakdown, recentJobs };
}

export function getPaginatedJobs(
  page: number,
  limit: number,
  filters: { status?: string; platform?: string; search?: string },
  sortBy: string = 'created_at',
  sortOrder: string = 'desc'
): { jobs: DownloadJobRecord[]; total: number; page: number; totalPages: number } {
  const db = getDatabase();
  const conditions: string[] = ['1=1'];
  const values: unknown[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }
  if (filters.platform) {
    conditions.push('platform = ?');
    values.push(filters.platform);
  }
  if (filters.search) {
    conditions.push('(source_url LIKE ? OR id LIKE ?)');
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const whereClause = conditions.join(' AND ');
  const allowedSortColumns = ['created_at', 'updated_at', 'status', 'platform'];
  const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const total = (db.prepare(`SELECT COUNT(*) as count FROM download_jobs WHERE ${whereClause}`).get(...values) as { count: number }).count;
  const offset = (page - 1) * limit;

  const jobs = db.prepare(
    `SELECT * FROM download_jobs WHERE ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`
  ).all(...values, limit, offset) as DownloadJobRecord[];

  return {
    jobs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

import fs from 'fs';
import path from 'path';
import { getDatabase } from '../db/connection.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

/**
 * Cleanup service for expired temporary files and job records.
 */
export function cleanupExpiredFiles(): { filesDeleted: number; jobsExpired: number } {
  let filesDeleted = 0;
  let jobsExpired = 0;

  const db = getDatabase();

  // Find expired jobs with files
  const expiredJobs = db.prepare(`
    SELECT id, file_path FROM download_jobs
    WHERE expires_at IS NOT NULL
    AND expires_at < datetime('now')
    AND status NOT IN ('expired', 'cancelled')
  `).all() as Array<{ id: string; file_path: string | null }>;

  for (const job of expiredJobs) {
    // Delete the file if it exists
    if (job.file_path) {
      try {
        if (fs.existsSync(job.file_path)) {
          fs.unlinkSync(job.file_path);
          filesDeleted++;
          logger.debug({ jobId: job.id, path: job.file_path }, 'Deleted expired file');
        }
      } catch (err) {
        logger.warn({ err, jobId: job.id, path: job.file_path }, 'Failed to delete expired file');
      }
    }

    // Update job status
    db.prepare(`
      UPDATE download_jobs SET status = 'expired', updated_at = datetime('now') WHERE id = ?
    `).run(job.id);
    jobsExpired++;
  }

  // Also clean up any orphaned files in temp directory
  const tempDir = path.resolve(config.storage.tempDir);
  if (fs.existsSync(tempDir)) {
    try {
      const files = fs.readdirSync(tempDir);
      const cutoff = Date.now() - (config.storage.tempFileTtlMinutes * 2 * 60 * 1000); // 2x TTL for safety

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isFile() && stat.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            filesDeleted++;
            logger.debug({ path: filePath }, 'Deleted orphaned temp file');
          }
        } catch {
          // skip files we can't stat
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to clean orphaned temp files');
    }
  }

  // Clean old metadata cache entries
  db.prepare(`
    DELETE FROM metadata_cache WHERE expires_at < datetime('now')
  `).run();

  // Clean old system events (keep last 7 days)
  db.prepare(`
    DELETE FROM system_events WHERE created_at < datetime('now', '-7 days')
  `).run();

  if (filesDeleted > 0 || jobsExpired > 0) {
    logger.info({ filesDeleted, jobsExpired }, 'Cleanup completed');

    try {
      db.prepare(
        `INSERT INTO system_events (event_type, details) VALUES (?, ?)`
      ).run('cleanup', JSON.stringify({ filesDeleted, jobsExpired }));
    } catch { /* ignore */ }
  }

  return { filesDeleted, jobsExpired };
}

/**
 * Get temp storage usage in bytes.
 */
export function getTempStorageUsage(): number {
  const tempDir = path.resolve(config.storage.tempDir);
  if (!fs.existsSync(tempDir)) return 0;

  let totalSize = 0;
  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      try {
        const stat = fs.statSync(path.join(tempDir, file));
        if (stat.isFile()) totalSize += stat.size;
      } catch { /* skip */ }
    }
  } catch { /* ignore */ }
  return totalSize;
}

/**
 * Ensure temp directory exists.
 */
export function ensureTempDir(): void {
  const tempDir = path.resolve(config.storage.tempDir);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    logger.info({ path: tempDir }, 'Created temp directory');
  }
}

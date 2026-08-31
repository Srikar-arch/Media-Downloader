import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): Database.Database {
  const dbPath = path.resolve(config.database.path);
  const dbDir = path.dirname(dbPath);

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  logger.info({ path: dbPath }, 'Database initialized');
  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS download_jobs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      source_url TEXT NOT NULL,
      requested_format TEXT,
      requested_quality TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      progress INTEGER NOT NULL DEFAULT 0,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON download_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_session ON download_jobs(session_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_platform ON download_jobs(platform);
    CREATE INDEX IF NOT EXISTS idx_jobs_created ON download_jobs(created_at);
    CREATE INDEX IF NOT EXISTS idx_jobs_expires ON download_jobs(expires_at);

    CREATE TABLE IF NOT EXISTS system_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_created ON system_events(created_at);

    CREATE TABLE IF NOT EXISTS metadata_cache (
      url_hash TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      metadata TEXT NOT NULL,
      formats TEXT NOT NULL,
      platform TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cache_expires ON metadata_cache(expires_at);
  `);

  logger.info('Database migrations completed');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    logger.info('Database closed');
  }
}

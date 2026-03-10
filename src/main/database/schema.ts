import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

/** Get the database path - in user data directory */
export function getDbPath(): string {
  try {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'mcp-manager.db');
  } catch {
    // Fallback for testing outside Electron
    return path.join(process.cwd(), 'mcp-manager.db');
  }
}

/** Initialize and return the SQLite database with WAL mode and schema */
export function initDatabase(dbPath?: string): Database.Database {
  const finalPath = dbPath || getDbPath();
  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(finalPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      command TEXT NOT NULL,
      args TEXT NOT NULL DEFAULT '[]',
      env TEXT NOT NULL DEFAULT '{}',
      transport_type TEXT NOT NULL DEFAULT 'stdio',
      url TEXT,
      headers TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_targets (
      server_id TEXT NOT NULL,
      client_type TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (server_id, client_type),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS config_backups (
      id TEXT PRIMARY KEY,
      client_type TEXT NOT NULL,
      config_path TEXT NOT NULL,
      backup_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrate: add headers column if missing (for existing databases)
  const columns = db.pragma('table_info(servers)') as Array<{ name: string }>;
  if (!columns.some(c => c.name === 'headers')) {
    db.exec(`ALTER TABLE servers ADD COLUMN headers TEXT NOT NULL DEFAULT '{}'`);
  }

  return db;
}

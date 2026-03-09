import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { ConfigBackup, ClientType } from '../../shared/types.js';

export class BackupRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getAll(): ConfigBackup[] {
    const rows = this.db
      .prepare('SELECT * FROM config_backups ORDER BY created_at DESC')
      .all() as any[];
    return rows.map(this.rowToBackup);
  }

  getByClient(clientType: ClientType): ConfigBackup[] {
    const rows = this.db
      .prepare('SELECT * FROM config_backups WHERE client_type = ? ORDER BY created_at DESC')
      .all(clientType) as any[];
    return rows.map(this.rowToBackup);
  }

  getById(id: string): ConfigBackup | null {
    const row = this.db
      .prepare('SELECT * FROM config_backups WHERE id = ?')
      .get(id) as any;
    return row ? this.rowToBackup(row) : null;
  }

  create(clientType: ClientType, configPath: string, backupPath: string, sizeBytes: number): ConfigBackup {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO config_backups (id, client_type, config_path, backup_path, size_bytes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, clientType, configPath, backupPath, sizeBytes, now);

    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM config_backups WHERE id = ?').run(id);
  }

  /** Keep only the N most recent backups per client, delete the rest. Returns deleted IDs. */
  pruneOld(keepPerClient: number = 10): string[] {
    const rows = this.db.prepare(`
      SELECT id FROM config_backups
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY client_type ORDER BY created_at DESC) AS rn
          FROM config_backups
        ) WHERE rn <= ?
      )
    `).all(keepPerClient) as any[];

    const ids = rows.map((r: any) => r.id as string);
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      this.db.prepare(`DELETE FROM config_backups WHERE id IN (${placeholders})`).run(...ids);
    }
    return ids;
  }

  private rowToBackup(row: any): ConfigBackup {
    return {
      id: row.id,
      clientType: row.client_type as ClientType,
      configPath: row.config_path,
      backupPath: row.backup_path,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at,
    };
  }
}

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { McpServer, McpServerInput, SyncTarget, ClientType } from '../../shared/types.js';

export class ServerRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getAll(): McpServer[] {
    const rows = this.db.prepare('SELECT * FROM servers ORDER BY name').all() as any[];
    return rows.map(this.rowToServer);
  }

  getById(id: string): McpServer | null {
    const row = this.db.prepare('SELECT * FROM servers WHERE id = ?').get(id) as any;
    return row ? this.rowToServer(row) : null;
  }

  create(input: McpServerInput): McpServer {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO servers (id, name, command, args, env, transport_type, url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.command,
      JSON.stringify(input.args),
      JSON.stringify(input.env),
      input.transportType,
      input.url || null,
      now,
      now,
    );

    return this.getById(id)!;
  }

  update(id: string, input: McpServerInput): McpServer {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`Server with id '${id}' not found`);
    }

    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE servers SET name = ?, command = ?, args = ?, env = ?, transport_type = ?, url = ?, updated_at = ?
      WHERE id = ?
    `).run(
      input.name,
      input.command,
      JSON.stringify(input.args),
      JSON.stringify(input.env),
      input.transportType,
      input.url || null,
      now,
      id,
    );

    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  }

  // --- Sync targets ---

  getSyncTargets(serverId: string): SyncTarget[] {
    const rows = this.db
      .prepare('SELECT * FROM sync_targets WHERE server_id = ?')
      .all(serverId) as any[];

    return rows.map(row => ({
      serverId: row.server_id as string,
      clientType: row.client_type as ClientType,
      enabled: Boolean(row.enabled),
    }));
  }

  setSyncTarget(serverId: string, clientType: ClientType, enabled: boolean): void {
    this.db.prepare(`
      INSERT INTO sync_targets (server_id, client_type, enabled) VALUES (?, ?, ?)
      ON CONFLICT(server_id, client_type) DO UPDATE SET enabled = ?
    `).run(serverId, clientType, enabled ? 1 : 0, enabled ? 1 : 0);
  }

  getEnabledSyncTargets(serverId: string): SyncTarget[] {
    const rows = this.db
      .prepare('SELECT * FROM sync_targets WHERE server_id = ? AND enabled = 1')
      .all(serverId) as any[];

    return rows.map(row => ({
      serverId: row.server_id as string,
      clientType: row.client_type as ClientType,
      enabled: true,
    }));
  }

  getAllEnabledSyncTargets(): (SyncTarget & { server: McpServer })[] {
    const rows = this.db.prepare(`
      SELECT st.server_id, st.client_type, st.enabled,
             s.id, s.name, s.command, s.args, s.env,
             s.transport_type, s.url, s.created_at, s.updated_at
      FROM sync_targets st
      JOIN servers s ON st.server_id = s.id
      WHERE st.enabled = 1
    `).all() as any[];

    return rows.map(row => ({
      serverId: row.server_id as string,
      clientType: row.client_type as ClientType,
      enabled: true,
      server: this.rowToServer(row),
    }));
  }

  private rowToServer(row: any): McpServer {
    return {
      id: row.id,
      name: row.name,
      command: row.command,
      args: JSON.parse(row.args),
      env: JSON.parse(row.env),
      transportType: row.transport_type as McpServer['transportType'],
      url: row.url || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

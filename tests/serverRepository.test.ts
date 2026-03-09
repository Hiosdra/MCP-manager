import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase } from '../src/main/database/schema';
import { ServerRepository } from '../src/main/database/serverRepository';
import { McpServerInput, ClientType } from '../src/shared/types';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { mkdir, rm } from 'fs/promises';

let tmpDir: string;
let db: Database.Database;
let repo: ServerRepository;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `mcp-db-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmpDir, { recursive: true });
  const dbPath = path.join(tmpDir, 'test.db');
  db = initDatabase(dbPath);
  repo = new ServerRepository(db);
});

afterEach(async () => {
  db.close();
  await rm(tmpDir, { recursive: true, force: true });
});

function makeInput(overrides: Partial<McpServerInput> = {}): McpServerInput {
  return {
    name: 'test-server',
    command: 'npx',
    args: ['-y', 'test-pkg'],
    env: { KEY: 'value' },
    transportType: 'stdio',
    ...overrides,
  };
}

describe('ServerRepository', () => {
  describe('CRUD operations', () => {
    it('creates a server and retrieves it', () => {
      const input = makeInput();
      const server = repo.create(input);

      expect(server.id).toBeDefined();
      expect(server.name).toBe('test-server');
      expect(server.command).toBe('npx');
      expect(server.args).toEqual(['-y', 'test-pkg']);
      expect(server.env).toEqual({ KEY: 'value' });
      expect(server.transportType).toBe('stdio');
      expect(server.createdAt).toBeDefined();
      expect(server.updatedAt).toBeDefined();
    });

    it('getAll returns all servers sorted by name', () => {
      repo.create(makeInput({ name: 'beta-server' }));
      repo.create(makeInput({ name: 'alpha-server' }));

      const all = repo.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].name).toBe('alpha-server');
      expect(all[1].name).toBe('beta-server');
    });

    it('getById returns null for non-existent id', () => {
      expect(repo.getById('non-existent')).toBeNull();
    });

    it('updates a server', () => {
      const server = repo.create(makeInput());
      const updated = repo.update(server.id, makeInput({
        name: 'updated-server',
        command: 'node',
      }));

      expect(updated.name).toBe('updated-server');
      expect(updated.command).toBe('node');
      expect(updated.id).toBe(server.id);
    });

    it('throws when updating non-existent server', () => {
      expect(() => repo.update('bad-id', makeInput())).toThrow("not found");
    });

    it('deletes a server', () => {
      const server = repo.create(makeInput());
      repo.delete(server.id);

      expect(repo.getById(server.id)).toBeNull();
      expect(repo.getAll()).toHaveLength(0);
    });

    it('enforces unique server names', () => {
      repo.create(makeInput({ name: 'unique-name' }));
      expect(() => repo.create(makeInput({ name: 'unique-name' }))).toThrow();
    });
  });

  describe('Sync targets', () => {
    it('sets and retrieves sync targets', () => {
      const server = repo.create(makeInput());
      repo.setSyncTarget(server.id, ClientType.ClaudeDesktop, true);
      repo.setSyncTarget(server.id, ClientType.Cursor, false);

      const targets = repo.getSyncTargets(server.id);
      expect(targets).toHaveLength(2);

      const claude = targets.find((t) => t.clientType === ClientType.ClaudeDesktop);
      expect(claude?.enabled).toBe(true);

      const cursor = targets.find((t) => t.clientType === ClientType.Cursor);
      expect(cursor?.enabled).toBe(false);
    });

    it('getEnabledSyncTargets returns only enabled targets', () => {
      const server = repo.create(makeInput());
      repo.setSyncTarget(server.id, ClientType.ClaudeDesktop, true);
      repo.setSyncTarget(server.id, ClientType.Cursor, false);
      repo.setSyncTarget(server.id, ClientType.Zed, true);

      const enabled = repo.getEnabledSyncTargets(server.id);
      expect(enabled).toHaveLength(2);
      expect(enabled.every((t) => t.enabled)).toBe(true);
    });

    it('setSyncTarget toggles existing target', () => {
      const server = repo.create(makeInput());
      repo.setSyncTarget(server.id, ClientType.ClaudeDesktop, true);

      let targets = repo.getSyncTargets(server.id);
      expect(targets[0].enabled).toBe(true);

      repo.setSyncTarget(server.id, ClientType.ClaudeDesktop, false);
      targets = repo.getSyncTargets(server.id);
      expect(targets[0].enabled).toBe(false);
    });

    it('cascades delete to sync targets', () => {
      const server = repo.create(makeInput());
      repo.setSyncTarget(server.id, ClientType.ClaudeDesktop, true);
      repo.setSyncTarget(server.id, ClientType.Cursor, true);

      repo.delete(server.id);

      const targets = repo.getSyncTargets(server.id);
      expect(targets).toHaveLength(0);
    });

    it('getAllEnabledSyncTargets returns targets with server data', () => {
      const s1 = repo.create(makeInput({ name: 'server1' }));
      const s2 = repo.create(makeInput({ name: 'server2' }));
      repo.setSyncTarget(s1.id, ClientType.ClaudeDesktop, true);
      repo.setSyncTarget(s1.id, ClientType.Cursor, false);
      repo.setSyncTarget(s2.id, ClientType.Zed, true);

      const all = repo.getAllEnabledSyncTargets();
      expect(all).toHaveLength(2);
      expect(all.every((t) => t.server !== undefined)).toBe(true);
    });
  });
});

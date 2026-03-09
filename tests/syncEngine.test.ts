import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, readFile, mkdir, rm, access, readdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { McpServer, ClientType } from '../src/shared/types';
import { syncServerToClient } from '../src/main/sync/syncEngine';
import { readJsonConfig } from '../src/main/parsers/jsonParser';
import { readJsoncConfig } from '../src/main/parsers/jsoncParser';
import { readYamlConfig } from '../src/main/parsers/yamlParser';
import { readXmlConfig } from '../src/main/parsers/xmlParser';

let tmpDir: string;

function makeServer(overrides: Partial<McpServer> = {}): McpServer {
  return {
    id: 'test-id',
    name: 'my-server',
    command: 'npx',
    args: ['-y', 'test-pkg'],
    env: { API_KEY: 'secret' },
    transportType: 'stdio',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `mcp-sync-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tmpDir, { recursive: true, force: true });
});

// We need to mock getClientConfigPath to return paths in our tmp dir
vi.mock('../src/main/utils/clientDetector', () => ({
  detectClients: vi.fn().mockResolvedValue([]),
  getClientConfigPath: vi.fn(),
}));

// Mock Electron's app module so backupFile() can resolve the backup directory
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue(os.tmpdir()),
  },
}));

import { getClientConfigPath } from '../src/main/utils/clientDetector';
const mockedGetPath = vi.mocked(getClientConfigPath);

describe('Sync Engine', () => {
  describe('syncServerToClient - JSON clients', () => {
    it('syncs to Claude Desktop format', async () => {
      const configPath = path.join(tmpDir, 'claude_desktop_config.json');
      mockedGetPath.mockReturnValue(configPath);

      const server = makeServer();
      const result = await syncServerToClient(server, ClientType.ClaudeDesktop);

      expect(result.success).toBe(true);
      expect(result.clientType).toBe(ClientType.ClaudeDesktop);

      const data = await readJsonConfig(configPath);
      expect(data.mcpServers['my-server']).toEqual({
        command: 'npx',
        args: ['-y', 'test-pkg'],
        env: { API_KEY: 'secret' },
      });
    });

    it('syncs to Cursor format', async () => {
      const configPath = path.join(tmpDir, 'mcp.json');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.Cursor);

      expect(result.success).toBe(true);
      const data = await readJsonConfig(configPath);
      expect(data.mcpServers['my-server'].command).toBe('npx');
    });

    it('syncs to Cody format with cody.mcpServers key', async () => {
      const configPath = path.join(tmpDir, 'mcp_servers.json');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.SourcegraphCody);

      expect(result.success).toBe(true);
      const data = await readJsonConfig(configPath);
      expect(data['cody.mcpServers']['my-server']).toBeDefined();
    });
  });

  describe('syncServerToClient - JSONC clients', () => {
    it('syncs to Zed format with context_servers', async () => {
      const configPath = path.join(tmpDir, 'settings.json');
      mockedGetPath.mockReturnValue(configPath);

      // Create existing Zed settings
      await writeFile(configPath, `{
  // My settings
  "theme": "One Dark"
}`);

      const result = await syncServerToClient(makeServer(), ClientType.Zed);

      expect(result.success).toBe(true);

      const raw = await readFile(configPath, 'utf-8');
      expect(raw).toContain('// My settings');
      expect(raw).toContain('"theme": "One Dark"');

      const data = await readJsoncConfig(configPath);
      expect(data.context_servers['my-server']).toBeDefined();
    });

    it('syncs to OpenCode format with type:local and environment', async () => {
      const configPath = path.join(tmpDir, 'opencode.json');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.OpenCode);

      expect(result.success).toBe(true);
      const data = await readJsoncConfig(configPath);
      expect(data.mcp['my-server']).toEqual({
        type: 'local',
        command: ['npx', '-y', 'test-pkg'],
        environment: { API_KEY: 'secret' },
        enabled: true,
      });
    });
  });

  describe('syncServerToClient - YAML clients', () => {
    it('syncs to Continue.dev array format', async () => {
      const configPath = path.join(tmpDir, 'config.yaml');
      mockedGetPath.mockReturnValue(configPath);

      await writeFile(configPath, 'name: Config\nmcpServers: []\n');

      const result = await syncServerToClient(makeServer(), ClientType.ContinueDev);

      expect(result.success).toBe(true);
      const data = await readYamlConfig(configPath);
      expect(data.mcpServers).toHaveLength(1);
      expect(data.mcpServers[0].name).toBe('my-server');
    });

    it('syncs to Goose format with cmd/envs', async () => {
      const configPath = path.join(tmpDir, 'config.yaml');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.Goose);

      expect(result.success).toBe(true);
      const data = await readYamlConfig(configPath);
      expect(data.extensions['my-server']).toEqual({
        cmd: 'npx',
        args: ['-y', 'test-pkg'],
        envs: { API_KEY: 'secret' },
      });
    });
  });

  describe('syncServerToClient - XML client', () => {
    it('syncs to JetBrains XML format', async () => {
      const configPath = path.join(tmpDir, 'llm.mcpServers.xml');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.JetBrains);

      expect(result.success).toBe(true);

      const data = await readXmlConfig(configPath);
      const components = Array.isArray(data.application.component)
        ? data.application.component
        : [data.application.component];
      const mcpComp = components.find((c: any) => c?.$?.name === 'llm.mcpServers');
      const servers = Array.isArray(mcpComp.server) ? mcpComp.server : [mcpComp.server];
      const srv = servers.find((s: any) => s?.$?.name === 'my-server');

      expect(srv.command).toBe('npx');
      expect(srv.args).toBe('-y test-pkg');
    });
  });

  describe('Backup behavior', () => {
    it('creates timestamped backup file before mutation', async () => {
      const configPath = path.join(tmpDir, 'config.json');
      await writeFile(configPath, '{"existing": true}');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.ClaudeDesktop);

      expect(result.success).toBe(true);
      expect(result.backedUp).toBe(true);
      expect(result.backupPath).toBeDefined();

      const backup = await readFile(result.backupPath!, 'utf-8');
      expect(JSON.parse(backup)).toEqual({ existing: true });
    });

    it('does not create backup when file is new', async () => {
      const configPath = path.join(tmpDir, 'new_config.json');
      mockedGetPath.mockReturnValue(configPath);

      const result = await syncServerToClient(makeServer(), ClientType.ClaudeDesktop);

      expect(result.success).toBe(true);
      expect(result.backedUp).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('returns error when config path is null', async () => {
      mockedGetPath.mockReturnValue(null);

      const result = await syncServerToClient(makeServer(), ClientType.Zed);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No config path');
    });
  });
});

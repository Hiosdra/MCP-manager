import { describe, it, expect } from 'vitest';
import {
  translateForClient,
  translateStandard,
  translateZed,
  translateContinueDev,
  translateOpenCode,
  translateCody,
  translateGoose,
  translateJetBrains,
  sanitizeJetBrainsArg,
} from '../src/main/translators/schemaTranslator';
import { McpServer, ClientType } from '../src/shared/types';

function makeServer(overrides: Partial<McpServer> = {}): McpServer {
  return {
    id: 'test-id',
    name: 'my-postgres-server',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
    env: { PGPASSWORD: 'secret_password' },
    transportType: 'stdio',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSseServer(overrides: Partial<McpServer> = {}): McpServer {
  return {
    id: 'test-sse-id',
    name: 'my-remote-server',
    command: '',
    args: [],
    env: { API_KEY: 'key123' },
    transportType: 'sse',
    url: 'http://localhost:3000/sse',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// --- Claude Desktop, Cursor, Windsurf, Cline (standard format) ---

describe('Standard format (Claude/Cursor/Windsurf/Cline)', () => {
  const standardClients = [
    ClientType.ClaudeDesktop,
    ClientType.Cursor,
    ClientType.Windsurf,
    ClientType.VSCodeCline,
  ];

  it.each(standardClients)('translates stdio server for %s', (clientType) => {
    const server = makeServer();
    const result = translateForClient(server, clientType);

    expect(result.sectionKey).toBe('mcpServers');
    expect(result.serverName).toBe('my-postgres-server');
    expect(result.format).toBe('json');
    expect(result.config).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      env: { PGPASSWORD: 'secret_password' },
    });
  });

  it.each(standardClients)('translates SSE server for %s', (clientType) => {
    const server = makeSseServer();
    const result = translateForClient(server, clientType);

    expect(result.config).toEqual({
      url: 'http://localhost:3000/sse',
      env: { API_KEY: 'key123' },
    });
  });

  it('omits env when empty', () => {
    const server = makeServer({ env: {} });
    const result = translateForClient(server, ClientType.ClaudeDesktop);
    expect(result.config).not.toHaveProperty('env');
  });
});

// --- Zed Editor ---

describe('Zed Editor', () => {
  it('uses context_servers key with jsonc format', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.Zed);

    expect(result.sectionKey).toBe('context_servers');
    expect(result.format).toBe('jsonc');
    expect(result.config).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      env: { PGPASSWORD: 'secret_password' },
    });
  });
});

// --- Continue.dev ---

describe('Continue.dev', () => {
  it('translates to yaml-array format with name field', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.ContinueDev);

    expect(result.sectionKey).toBe('mcpServers');
    expect(result.format).toBe('yaml-array');
    expect(result.config).toEqual({
      name: 'my-postgres-server',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      env: { PGPASSWORD: 'secret_password' },
    });
  });

  it('translates SSE server with url field', () => {
    const server = makeSseServer();
    const result = translateForClient(server, ClientType.ContinueDev);

    expect(result.config).toEqual({
      name: 'my-remote-server',
      url: 'http://localhost:3000/sse',
      env: { API_KEY: 'key123' },
    });
  });
});

// --- OpenCode AI ---

describe('OpenCode AI', () => {
  it('translates to jsonc format with type:local and command array', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.OpenCode);

    expect(result.sectionKey).toBe('mcp');
    expect(result.format).toBe('jsonc');
    expect(result.config).toEqual({
      type: 'local',
      command: ['npx', '-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      environment: { PGPASSWORD: 'secret_password' },
      enabled: true,
    });
  });

  it('uses "environment" key instead of "env"', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.OpenCode);

    expect(result.config).toHaveProperty('environment');
    expect(result.config).not.toHaveProperty('env');
  });

  it('translates SSE server with type:remote', () => {
    const server = makeSseServer();
    const result = translateForClient(server, ClientType.OpenCode);

    expect(result.config).toEqual({
      type: 'remote',
      url: 'http://localhost:3000/sse',
      environment: { API_KEY: 'key123' },
      enabled: true,
    });
  });
});

// --- Sourcegraph Cody ---

describe('Sourcegraph Cody', () => {
  it('uses cody.mcpServers key', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.SourcegraphCody);

    expect(result.sectionKey).toBe('cody.mcpServers');
    expect(result.format).toBe('json');
    expect(result.config).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      env: { PGPASSWORD: 'secret_password' },
    });
  });

  it('always includes env (even empty)', () => {
    const server = makeServer({ env: {} });
    const result = translateForClient(server, ClientType.SourcegraphCody);
    expect(result.config).toHaveProperty('env');
    expect(result.config.env).toEqual({});
  });
});

// --- Goose (Block) ---

describe('Goose (Block)', () => {
  it('uses extensions key, cmd and envs', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.Goose);

    expect(result.sectionKey).toBe('extensions');
    expect(result.format).toBe('yaml-map');
    expect(result.config).toEqual({
      cmd: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
      envs: { PGPASSWORD: 'secret_password' },
    });
  });

  it('uses envs (not env)', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.Goose);

    expect(result.config).toHaveProperty('envs');
    expect(result.config).not.toHaveProperty('env');
  });

  it('translates SSE server with uri field', () => {
    const server = makeSseServer();
    const result = translateForClient(server, ClientType.Goose);

    expect(result.config).toEqual({
      uri: 'http://localhost:3000/sse',
      envs: { API_KEY: 'key123' },
    });
  });
});

// --- JetBrains ---

describe('JetBrains', () => {
  it('translates to XML format with joined args', () => {
    const server = makeServer();
    const result = translateForClient(server, ClientType.JetBrains);

    expect(result.format).toBe('xml');
    expect(result.config).toEqual({
      serverName: 'my-postgres-server',
      command: 'npx',
      args: '-y @modelcontextprotocol/server-postgres postgresql://localhost/mydb',
    });
  });

  it('sanitizes args with spaces by wrapping in quotes', () => {
    expect(sanitizeJetBrainsArg('/path/with spaces/file')).toBe('"/path/with spaces/file"');
    expect(sanitizeJetBrainsArg('simple')).toBe('simple');
    expect(sanitizeJetBrainsArg('"already quoted"')).toBe('"already quoted"');
  });

  it('wraps paths with spaces in args', () => {
    const server = makeServer({
      args: ['-y', '/path/with spaces/script.js'],
    });
    const result = translateForClient(server, ClientType.JetBrains);

    expect(result.config.args).toBe('-y "/path/with spaces/script.js"');
  });
});

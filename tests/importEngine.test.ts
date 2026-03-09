import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  importFromStandardJson,
  importFromZed,
  importFromOpenCode,
  importFromCody,
  importFromContinueDev,
  importFromGoose,
  importFromJetBrains,
} from '../src/main/sync/importEngine';
import { writeJsonConfig } from '../src/main/parsers/jsonParser';
import { writeXmlConfig } from '../src/main/parsers/xmlParser';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `mcp-import-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// --- Standard JSON (Claude, Cursor, Windsurf, Cline) ---

describe('importFromStandardJson', () => {
  it('imports stdio servers from mcpServers section', () => {
    const data = {
      mcpServers: {
        'my-server': {
          command: 'npx',
          args: ['-y', 'test-pkg'],
          env: { API_KEY: 'secret' },
        },
        'another-server': {
          command: 'node',
          args: ['script.js'],
        },
      },
    };

    const servers = importFromStandardJson(data, 'mcpServers');
    expect(servers).toHaveLength(2);

    expect(servers[0]).toEqual({
      name: 'my-server',
      command: 'npx',
      args: ['-y', 'test-pkg'],
      env: { API_KEY: 'secret' },
      transportType: 'stdio',
    });

    expect(servers[1].name).toBe('another-server');
    expect(servers[1].env).toEqual({});
  });

  it('imports SSE servers (url without command)', () => {
    const data = {
      mcpServers: {
        'remote-srv': {
          url: 'http://localhost:3000/sse',
          env: { TOKEN: '123' },
        },
      },
    };

    const servers = importFromStandardJson(data, 'mcpServers');
    expect(servers).toHaveLength(1);
    expect(servers[0].transportType).toBe('sse');
    expect(servers[0].url).toBe('http://localhost:3000/sse');
  });

  it('returns empty array when section missing', () => {
    expect(importFromStandardJson({}, 'mcpServers')).toEqual([]);
    expect(importFromStandardJson(null, 'mcpServers')).toEqual([]);
  });
});

// --- Zed Editor ---

describe('importFromZed', () => {
  it('imports from context_servers', () => {
    const data = {
      theme: 'One Dark',
      context_servers: {
        'my-zed-server': {
          command: 'npx',
          args: ['-y', 'zed-mcp'],
          env: { KEY: 'val' },
        },
      },
    };

    const servers = importFromZed(data);
    expect(servers).toHaveLength(1);
    expect(servers[0].name).toBe('my-zed-server');
    expect(servers[0].command).toBe('npx');
  });

  it('returns empty when no context_servers', () => {
    expect(importFromZed({ theme: 'dark' })).toEqual([]);
  });
});

// --- OpenCode AI ---

describe('importFromOpenCode', () => {
  it('imports local servers with command array and environment', () => {
    const data = {
      mcp: {
        'oc-server': {
          type: 'local',
          command: ['npx', '-y', 'test-pkg', 'postgres://localhost/db'],
          environment: { PGPASSWORD: 'secret' },
          enabled: true,
        },
      },
    };

    const servers = importFromOpenCode(data);
    expect(servers).toHaveLength(1);
    expect(servers[0]).toEqual({
      name: 'oc-server',
      command: 'npx',
      args: ['-y', 'test-pkg', 'postgres://localhost/db'],
      env: { PGPASSWORD: 'secret' },
      transportType: 'stdio',
    });
  });

  it('imports remote servers with url', () => {
    const data = {
      mcp: {
        'remote-oc': {
          type: 'remote',
          url: 'http://example.com/sse',
          environment: { TOKEN: 'abc' },
        },
      },
    };

    const servers = importFromOpenCode(data);
    expect(servers).toHaveLength(1);
    expect(servers[0].transportType).toBe('sse');
    expect(servers[0].url).toBe('http://example.com/sse');
    expect(servers[0].env).toEqual({ TOKEN: 'abc' });
  });

  it('handles missing environment field', () => {
    const data = {
      mcp: {
        'no-env': { type: 'local', command: ['node', 'server.js'] },
      },
    };

    const servers = importFromOpenCode(data);
    expect(servers[0].env).toEqual({});
  });
});

// --- Sourcegraph Cody ---

describe('importFromCody', () => {
  it('imports from cody.mcpServers key', () => {
    const data = {
      'cody.mcpServers': {
        'cody-srv': {
          command: 'npx',
          args: ['-y', 'cody-pkg'],
          env: {},
        },
      },
    };

    const servers = importFromCody(data);
    expect(servers).toHaveLength(1);
    expect(servers[0].name).toBe('cody-srv');
  });
});

// --- Continue.dev ---

describe('importFromContinueDev', () => {
  it('imports from mcpServers array with name field', () => {
    const data = {
      name: 'Config',
      mcpServers: [
        { name: 'server-a', command: 'npx', args: ['-y', 'pkg-a'], env: { K: 'V' } },
        { name: 'server-b', command: 'node', args: ['b.js'] },
      ],
    };

    const servers = importFromContinueDev(data);
    expect(servers).toHaveLength(2);
    expect(servers[0].name).toBe('server-a');
    expect(servers[0].env).toEqual({ K: 'V' });
    expect(servers[1].name).toBe('server-b');
    expect(servers[1].env).toEqual({});
  });

  it('imports SSE entries', () => {
    const data = {
      mcpServers: [
        { name: 'remote', url: 'http://localhost/sse' },
      ],
    };

    const servers = importFromContinueDev(data);
    expect(servers[0].transportType).toBe('sse');
    expect(servers[0].url).toBe('http://localhost/sse');
  });

  it('skips entries without name', () => {
    const data = {
      mcpServers: [
        { command: 'npx', args: [] },
        { name: 'valid', command: 'node', args: [] },
      ],
    };

    const servers = importFromContinueDev(data);
    expect(servers).toHaveLength(1);
    expect(servers[0].name).toBe('valid');
  });

  it('returns empty when mcpServers is not an array', () => {
    expect(importFromContinueDev({ mcpServers: {} })).toEqual([]);
    expect(importFromContinueDev({})).toEqual([]);
  });
});

// --- Goose (Block) ---

describe('importFromGoose', () => {
  it('imports from extensions with cmd and envs', () => {
    const data = {
      extensions: {
        'goose-srv': {
          cmd: 'npx',
          args: ['-y', 'goose-pkg'],
          envs: { SECRET: 'val' },
        },
      },
    };

    const servers = importFromGoose(data);
    expect(servers).toHaveLength(1);
    expect(servers[0]).toEqual({
      name: 'goose-srv',
      command: 'npx',
      args: ['-y', 'goose-pkg'],
      env: { SECRET: 'val' },
      transportType: 'stdio',
    });
  });

  it('imports SSE with uri', () => {
    const data = {
      extensions: {
        'remote-goose': { uri: 'http://remote.io/sse' },
      },
    };

    const servers = importFromGoose(data);
    expect(servers[0].transportType).toBe('sse');
    expect(servers[0].url).toBe('http://remote.io/sse');
  });

  it('handles missing envs', () => {
    const data = {
      extensions: {
        'no-envs': { cmd: 'node', args: ['s.js'] },
      },
    };

    const servers = importFromGoose(data);
    expect(servers[0].env).toEqual({});
  });
});

// --- JetBrains ---

describe('importFromJetBrains', () => {
  it('imports from JetBrains XML structure', () => {
    const data = {
      application: {
        component: {
          $: { name: 'llm.mcpServers' },
          server: [
            {
              $: { name: 'jb-server' },
              command: 'npx',
              args: '-y test-pkg postgres://localhost/db',
            },
          ],
        },
      },
    };

    const servers = importFromJetBrains(data);
    expect(servers).toHaveLength(1);
    expect(servers[0]).toEqual({
      name: 'jb-server',
      command: 'npx',
      args: ['-y', 'test-pkg', 'postgres://localhost/db'],
      env: {},
      transportType: 'stdio',
    });
  });

  it('handles quoted args with spaces', () => {
    const data = {
      application: {
        component: {
          $: { name: 'llm.mcpServers' },
          server: {
            $: { name: 'spacy-server' },
            command: 'node',
            args: '-y "/path/with spaces/script.js" simple',
          },
        },
      },
    };

    const servers = importFromJetBrains(data);
    expect(servers).toHaveLength(1);
    expect(servers[0].args).toEqual(['-y', '/path/with spaces/script.js', 'simple']);
  });

  it('returns empty when no mcpServers component', () => {
    const data = {
      application: {
        component: { $: { name: 'other.component' } },
      },
    };

    expect(importFromJetBrains(data)).toEqual([]);
  });

  it('returns empty for completely empty data', () => {
    expect(importFromJetBrains({})).toEqual([]);
    expect(importFromJetBrains(null)).toEqual([]);
  });
});

// --- Round-trip tests: export then import ---

import { translateForClient } from '../src/main/translators/schemaTranslator';
import { modifyJsonSection, readJsonConfig as readJsonForRoundtrip } from '../src/main/parsers/jsonParser';

describe('Round-trip: translate → write → import', () => {
  it('Claude Desktop round-trip', async () => {
    const filePath = path.join(tmpDir, 'claude.json');
    const server = {
      id: 'x', name: 'roundtrip-srv', command: 'npx', args: ['-y', 'pkg'],
      env: { KEY: 'VAL' }, transportType: 'stdio' as const,
      createdAt: '', updatedAt: '',
    };

    const translated = translateForClient(server, 'claude-desktop' as any);
    await modifyJsonSection(filePath, translated.sectionKey, translated.serverName, translated.config);

    const data = await readJsonForRoundtrip(filePath);
    const imported = importFromStandardJson(data, 'mcpServers');

    expect(imported).toHaveLength(1);
    expect(imported[0].name).toBe('roundtrip-srv');
    expect(imported[0].command).toBe('npx');
    expect(imported[0].args).toEqual(['-y', 'pkg']);
    expect(imported[0].env).toEqual({ KEY: 'VAL' });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm, access } from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  readJsonConfig,
  writeJsonConfig,
  modifyJsonSection,
  removeFromJsonSection,
} from '../src/main/parsers/jsonParser';
import {
  readJsoncConfig,
  modifyJsoncSection,
  removeFromJsoncSection,
} from '../src/main/parsers/jsoncParser';
import {
  readYamlConfig,
  modifyYamlSection,
  modifyYamlArraySection,
  removeFromYamlSection,
  removeFromYamlArraySection,
} from '../src/main/parsers/yamlParser';
import {
  readXmlConfig,
  writeXmlConfig,
  modifyJetBrainsConfig,
  removeFromJetBrainsConfig,
} from '../src/main/parsers/xmlParser';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `mcp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// --- JSON Parser ---

describe('JSON Parser', () => {
  it('reads an existing JSON file', async () => {
    const filePath = path.join(tmpDir, 'test.json');
    await writeFile(filePath, JSON.stringify({ mcpServers: { s1: { command: 'npx' } } }));

    const data = await readJsonConfig(filePath);
    expect(data.mcpServers.s1.command).toBe('npx');
  });

  it('returns {} for missing file', async () => {
    const data = await readJsonConfig(path.join(tmpDir, 'missing.json'));
    expect(data).toEqual({});
  });

  it('modifyJsonSection creates section and adds server', async () => {
    const filePath = path.join(tmpDir, 'config.json');

    await modifyJsonSection(filePath, 'mcpServers', 'my-server', {
      command: 'npx',
      args: ['-y', 'test'],
    });

    const data = await readJsonConfig(filePath);
    expect(data.mcpServers['my-server']).toEqual({
      command: 'npx',
      args: ['-y', 'test'],
    });
  });

  it('modifyJsonSection updates existing server', async () => {
    const filePath = path.join(tmpDir, 'config.json');
    await writeJsonConfig(filePath, { mcpServers: { s1: { command: 'old' } } });

    await modifyJsonSection(filePath, 'mcpServers', 's1', { command: 'new' });

    const data = await readJsonConfig(filePath);
    expect(data.mcpServers.s1.command).toBe('new');
  });

  it('removeFromJsonSection removes a server', async () => {
    const filePath = path.join(tmpDir, 'config.json');
    await writeJsonConfig(filePath, {
      mcpServers: { s1: { command: 'npx' }, s2: { command: 'node' } },
    });

    await removeFromJsonSection(filePath, 'mcpServers', 's1');

    const data = await readJsonConfig(filePath);
    expect(data.mcpServers).not.toHaveProperty('s1');
    expect(data.mcpServers).toHaveProperty('s2');
  });

  it('preserves other keys when modifying', async () => {
    const filePath = path.join(tmpDir, 'config.json');
    await writeJsonConfig(filePath, {
      theme: 'dark',
      mcpServers: { existing: { command: 'cmd' } },
    });

    await modifyJsonSection(filePath, 'mcpServers', 'new-server', { command: 'test' });

    const data = await readJsonConfig(filePath);
    expect(data.theme).toBe('dark');
    expect(data.mcpServers.existing).toEqual({ command: 'cmd' });
    expect(data.mcpServers['new-server']).toEqual({ command: 'test' });
  });
});

// --- JSONC Parser ---

describe('JSONC Parser', () => {
  it('reads JSONC with comments', async () => {
    const filePath = path.join(tmpDir, 'test.jsonc');
    const content = `{
  // This is a comment
  "$schema": "https://opencode.ai/config.json",
  "mcp": {}
}`;
    await writeFile(filePath, content);

    const data = await readJsoncConfig(filePath);
    expect(data['$schema']).toBe('https://opencode.ai/config.json');
    expect(data.mcp).toEqual({});
  });

  it('modifyJsoncSection preserves comments', async () => {
    const filePath = path.join(tmpDir, 'settings.jsonc');
    const content = `{
  // User settings
  "theme": "One Dark",
  "context_servers": {}
}`;
    await writeFile(filePath, content);

    await modifyJsoncSection(filePath, ['context_servers', 'my-server'], {
      command: 'npx',
      args: ['-y', 'test'],
    });

    const raw = await readFile(filePath, 'utf-8');
    expect(raw).toContain('// User settings');
    expect(raw).toContain('"theme": "One Dark"');

    const data = await readJsoncConfig(filePath);
    expect(data.context_servers['my-server']).toEqual({
      command: 'npx',
      args: ['-y', 'test'],
    });
  });

  it('removeFromJsoncSection removes a key', async () => {
    const filePath = path.join(tmpDir, 'config.jsonc');
    const content = `{
  "mcp": {
    "server1": { "type": "local" },
    "server2": { "type": "local" }
  }
}`;
    await writeFile(filePath, content);

    await removeFromJsoncSection(filePath, ['mcp', 'server1']);

    const data = await readJsoncConfig(filePath);
    expect(data.mcp).not.toHaveProperty('server1');
    expect(data.mcp).toHaveProperty('server2');
  });

  it('creates file if missing', async () => {
    const filePath = path.join(tmpDir, 'new.jsonc');

    await modifyJsoncSection(filePath, ['mcp', 'server1'], { type: 'local' });

    const data = await readJsoncConfig(filePath);
    expect(data.mcp.server1).toEqual({ type: 'local' });
  });
});

// --- YAML Parser ---

describe('YAML Parser', () => {
  it('reads a YAML config', async () => {
    const filePath = path.join(tmpDir, 'config.yaml');
    const content = `name: My Config
version: 1.0.0
mcpServers: []
`;
    await writeFile(filePath, content);

    const data = await readYamlConfig(filePath);
    expect(data.name).toBe('My Config');
    expect(data.version).toBe('1.0.0');
    expect(data.mcpServers).toEqual([]);
  });

  it('returns {} for missing file', async () => {
    const data = await readYamlConfig(path.join(tmpDir, 'missing.yaml'));
    expect(data).toEqual({});
  });

  it('modifyYamlSection adds a map entry (Goose format)', async () => {
    const filePath = path.join(tmpDir, 'goose.yaml');
    await writeFile(filePath, 'extensions: {}\n');

    await modifyYamlSection(filePath, 'extensions', 'my-server', {
      cmd: 'npx',
      args: ['-y', 'test'],
    });

    const data = await readYamlConfig(filePath);
    expect(data.extensions['my-server']).toEqual({
      cmd: 'npx',
      args: ['-y', 'test'],
    });
  });

  it('modifyYamlArraySection adds to Continue.dev format', async () => {
    const filePath = path.join(tmpDir, 'continue.yaml');
    await writeFile(filePath, 'name: Config\nmcpServers: []\n');

    await modifyYamlArraySection(filePath, 'mcpServers', {
      name: 'my-server',
      command: 'npx',
      args: ['-y', 'test'],
    });

    const data = await readYamlConfig(filePath);
    expect(data.mcpServers).toHaveLength(1);
    expect(data.mcpServers[0].name).toBe('my-server');
    expect(data.mcpServers[0].command).toBe('npx');
  });

  it('modifyYamlArraySection updates existing entry by name', async () => {
    const filePath = path.join(tmpDir, 'continue.yaml');
    await writeFile(filePath, `mcpServers:
  - name: my-server
    command: old-cmd
`);

    await modifyYamlArraySection(filePath, 'mcpServers', {
      name: 'my-server',
      command: 'new-cmd',
    });

    const data = await readYamlConfig(filePath);
    expect(data.mcpServers).toHaveLength(1);
    expect(data.mcpServers[0].command).toBe('new-cmd');
  });

  it('removeFromYamlSection removes a map entry', async () => {
    const filePath = path.join(tmpDir, 'goose.yaml');
    await writeFile(filePath, `extensions:
  s1:
    cmd: npx
  s2:
    cmd: node
`);

    await removeFromYamlSection(filePath, 'extensions', 's1');

    const data = await readYamlConfig(filePath);
    expect(data.extensions).not.toHaveProperty('s1');
    expect(data.extensions.s2).toEqual({ cmd: 'node' });
  });

  it('removeFromYamlArraySection removes by name', async () => {
    const filePath = path.join(tmpDir, 'continue.yaml');
    await writeFile(filePath, `mcpServers:
  - name: s1
    command: npx
  - name: s2
    command: node
`);

    await removeFromYamlArraySection(filePath, 'mcpServers', 's1');

    const data = await readYamlConfig(filePath);
    expect(data.mcpServers).toHaveLength(1);
    expect(data.mcpServers[0].name).toBe('s2');
  });

  it('preserves other YAML content', async () => {
    const filePath = path.join(tmpDir, 'goose.yaml');
    await writeFile(filePath, `custom_key: hello
extensions: {}
`);

    await modifyYamlSection(filePath, 'extensions', 'srv', { cmd: 'npx' });

    const data = await readYamlConfig(filePath);
    expect(data.custom_key).toBe('hello');
    expect(data.extensions.srv).toEqual({ cmd: 'npx' });
  });
});

// --- XML Parser ---

describe('XML Parser (JetBrains)', () => {
  it('reads default XML when file missing', async () => {
    const data = await readXmlConfig(path.join(tmpDir, 'missing.xml'));
    expect(data.application).toBeDefined();
  });

  it('modifyJetBrainsConfig adds a server to empty XML', async () => {
    const filePath = path.join(tmpDir, 'llm.mcpServers.xml');

    await modifyJetBrainsConfig(filePath, 'my-server', 'npx', '-y test-package');

    const data = await readXmlConfig(filePath);
    const components = Array.isArray(data.application.component)
      ? data.application.component
      : [data.application.component];
    const mcpComp = components.find((c: any) => c?.$ ?.name === 'llm.mcpServers');
    expect(mcpComp).toBeDefined();

    const servers = Array.isArray(mcpComp.server) ? mcpComp.server : [mcpComp.server];
    const srv = servers.find((s: any) => s?.$ ?.name === 'my-server');
    expect(srv).toBeDefined();
    expect(srv.command).toBe('npx');
    expect(srv.args).toBe('-y test-package');
  });

  it('modifyJetBrainsConfig updates existing server', async () => {
    const filePath = path.join(tmpDir, 'llm.mcpServers.xml');

    await modifyJetBrainsConfig(filePath, 'my-server', 'npx', '-y old-pkg');
    await modifyJetBrainsConfig(filePath, 'my-server', 'node', 'new-script.js');

    const data = await readXmlConfig(filePath);
    const components = Array.isArray(data.application.component)
      ? data.application.component
      : [data.application.component];
    const mcpComp = components.find((c: any) => c?.$ ?.name === 'llm.mcpServers');
    const servers = Array.isArray(mcpComp.server) ? mcpComp.server : [mcpComp.server];

    expect(servers).toHaveLength(1);
    expect(servers[0].command).toBe('node');
    expect(servers[0].args).toBe('new-script.js');
  });

  it('removeFromJetBrainsConfig removes a server', async () => {
    const filePath = path.join(tmpDir, 'llm.mcpServers.xml');

    await modifyJetBrainsConfig(filePath, 's1', 'npx', 'a');
    await modifyJetBrainsConfig(filePath, 's2', 'node', 'b');
    await removeFromJetBrainsConfig(filePath, 's1');

    const data = await readXmlConfig(filePath);
    const components = Array.isArray(data.application.component)
      ? data.application.component
      : [data.application.component];
    const mcpComp = components.find((c: any) => c?.$ ?.name === 'llm.mcpServers');
    const servers = Array.isArray(mcpComp.server) ? mcpComp.server : [mcpComp.server];

    const names = servers.map((s: any) => s?.$?.name);
    expect(names).not.toContain('s1');
    expect(names).toContain('s2');
  });
});

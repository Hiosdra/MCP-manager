import { test as base, Page } from '@playwright/test';

// Mock data
export const mockServers = [
  {
    id: 'srv-1',
    name: 'GitHub MCP',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: 'ghp_xxx' },
    transportType: 'stdio' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'srv-2',
    name: 'Filesystem Server',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    env: {},
    transportType: 'stdio' as const,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: 'srv-3',
    name: 'Remote SSE Server',
    command: '',
    args: [],
    env: { API_KEY: 'sk-abc' },
    transportType: 'sse' as const,
    url: 'http://localhost:3000/sse',
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
];

export const mockClients = [
  {
    clientType: 'claude-desktop',
    displayName: 'Claude Desktop',
    configPath: '/Users/test/.config/claude/config.json',
    installed: true,
    icon: '🤖',
  },
  {
    clientType: 'cursor',
    displayName: 'Cursor',
    configPath: '/Users/test/.cursor/mcp.json',
    installed: true,
    icon: '⚡',
  },
  {
    clientType: 'windsurf',
    displayName: 'Windsurf',
    configPath: '/Users/test/.windsurf/mcp.json',
    installed: false,
    icon: '🏄',
  },
];

/**
 * Injects a mock `window.api` before the React app loads.
 * `servers` is a mutable array so tests can observe add/delete side-effects.
 */
export async function injectMockApi(page: Page, opts?: { servers?: typeof mockServers }) {
  const servers = opts?.servers ?? [...mockServers];
  const clients = [...mockClients];

  await page.addInitScript((data) => {
    let _servers = data.servers;
    const _clients = data.clients;

    (window as any).api = {
      getServers: () => Promise.resolve([..._servers]),
      addServer: (input: any) => {
        const newServer = {
          ...input,
          id: `srv-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        _servers.push(newServer);
        return Promise.resolve(newServer);
      },
      updateServer: (id: string, input: any) => {
        const idx = _servers.findIndex((s: any) => s.id === id);
        if (idx !== -1) _servers[idx] = { ..._servers[idx], ...input, updatedAt: new Date().toISOString() };
        return Promise.resolve(_servers[idx]);
      },
      deleteServer: (id: string) => {
        _servers = _servers.filter((s: any) => s.id !== id);
        return Promise.resolve();
      },
      getDetectedClients: () => Promise.resolve([..._clients]),
      getSyncTargets: () => Promise.resolve([]),
      setSyncTarget: () => Promise.resolve(),
      syncServer: () => Promise.resolve([{ clientType: 'claude-desktop', success: true }]),
      syncAll: () => Promise.resolve(_clients.filter((c: any) => c.installed).map((c: any) => ({ clientType: c.clientType, success: true }))),
      importFromClient: (clientType: string) => Promise.resolve({ clientType, servers: [], error: undefined }),
      importFromAllClients: () => Promise.resolve(_clients.map((c: any) => ({ clientType: c.clientType, servers: [], error: undefined }))),
    };
  }, { servers, clients });
}

export const test = base.extend<{ mockPage: Page }>({
  mockPage: async ({ page }, use) => {
    await injectMockApi(page);
    await page.goto('/');
    await use(page);
  },
});

export { expect } from '@playwright/test';

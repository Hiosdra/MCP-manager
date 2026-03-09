import { McpServerInput, ClientType, TransportType } from '../../shared/types.js';
import { getClientConfigPath } from '../utils/clientDetector.js';
import { readJsonConfig } from '../parsers/jsonParser.js';
import { readJsoncConfig } from '../parsers/jsoncParser.js';
import { readYamlConfig } from '../parsers/yamlParser.js';
import { readXmlConfig } from '../parsers/xmlParser.js';

export interface ImportResult {
  clientType: ClientType;
  servers: McpServerInput[];
  error?: string;
}

// --- Reverse translators: client-specific config → generic McpServerInput ---

function importFromStandardJson(data: any, sectionKey: string): McpServerInput[] {
  const section = data?.[sectionKey];
  if (!section || typeof section !== 'object') return [];

  return Object.entries(section).map(([name, config]: [string, any]) => {
    const isSSE = config.url && !config.command;
    return {
      name,
      command: config.command ?? '',
      args: Array.isArray(config.args) ? config.args : [],
      env: config.env && typeof config.env === 'object' ? config.env : {},
      transportType: (isSSE ? 'sse' : 'stdio') as TransportType,
      ...(isSSE ? { url: config.url } : {}),
    };
  });
}

function importFromZed(data: any): McpServerInput[] {
  return importFromStandardJson(data, 'context_servers');
}

function importFromOpenCode(data: any): McpServerInput[] {
  const section = data?.mcp;
  if (!section || typeof section !== 'object') return [];

  return Object.entries(section).map(([name, config]: [string, any]) => {
    const isRemote = config.type === 'remote';

    let command = '';
    let args: string[] = [];

    if (Array.isArray(config.command)) {
      [command, ...args] = config.command;
    } else if (typeof config.command === 'string') {
      command = config.command;
    }

    const env = config.environment && typeof config.environment === 'object'
      ? config.environment
      : {};

    return {
      name,
      command,
      args,
      env,
      transportType: (isRemote ? 'sse' : 'stdio') as TransportType,
      ...(isRemote ? { url: config.url } : {}),
    };
  });
}

function importFromCody(data: any): McpServerInput[] {
  return importFromStandardJson(data, 'cody.mcpServers');
}

function importFromContinueDev(data: any): McpServerInput[] {
  const section = data?.mcpServers;
  if (!Array.isArray(section)) return [];

  return section
    .filter((entry: any) => entry && typeof entry === 'object' && entry.name)
    .map((entry: any) => {
      const isSSE = entry.url && !entry.command;
      return {
        name: entry.name,
        command: entry.command ?? '',
        args: Array.isArray(entry.args) ? entry.args : [],
        env: entry.env && typeof entry.env === 'object' ? entry.env : {},
        transportType: (isSSE ? 'sse' : 'stdio') as TransportType,
        ...(isSSE ? { url: entry.url } : {}),
      };
    });
}

function importFromGoose(data: any): McpServerInput[] {
  const section = data?.extensions;
  if (!section || typeof section !== 'object') return [];

  return Object.entries(section).map(([name, config]: [string, any]) => {
    const isSSE = config.uri && !config.cmd;
    return {
      name,
      command: config.cmd ?? '',
      args: Array.isArray(config.args) ? config.args : [],
      env: config.envs && typeof config.envs === 'object' ? config.envs : {},
      transportType: (isSSE ? 'sse' : 'stdio') as TransportType,
      ...(isSSE ? { url: config.uri } : {}),
    };
  });
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

function importFromJetBrains(data: any): McpServerInput[] {
  const components = ensureArray(data?.application?.component);
  const mcpComp = components.find((c: any) => c?.$?.name === 'llm.mcpServers');
  if (!mcpComp) return [];

  const servers = ensureArray(mcpComp.server);
  return servers
    .filter((s: any) => s?.$?.name)
    .map((s: any) => {
      const name = s.$.name;
      const command = s.command ?? '';
      const rawArgs = typeof s.args === 'string' ? s.args : '';
      // Parse space-separated args, respecting quoted strings
      const args = rawArgs.match(/"[^"]*"|\S+/g)?.map((a: string) =>
        a.startsWith('"') && a.endsWith('"') ? a.slice(1, -1) : a
      ) ?? [];

      return {
        name,
        command,
        args,
        env: {},
        transportType: 'stdio' as TransportType,
      };
    });
}

// --- Main import function ---

async function readClientConfig(clientType: ClientType, configPath: string): Promise<McpServerInput[]> {
  switch (clientType) {
    case ClientType.ClaudeDesktop:
    case ClientType.Cursor:
    case ClientType.Windsurf:
    case ClientType.VSCodeCline:
    case ClientType.CopilotCli:
    case ClientType.GeminiCli:
    case ClientType.Junie:
      return importFromStandardJson(await readJsonConfig(configPath), 'mcpServers');

    case ClientType.Zed:
      return importFromZed(await readJsoncConfig(configPath));

    case ClientType.OpenCode:
      return importFromOpenCode(await readJsoncConfig(configPath));

    case ClientType.SourcegraphCody:
      return importFromCody(await readJsonConfig(configPath));

    case ClientType.ContinueDev:
      return importFromContinueDev(await readYamlConfig(configPath));

    case ClientType.Goose:
      return importFromGoose(await readYamlConfig(configPath));

    case ClientType.JetBrains:
      return importFromJetBrains(await readXmlConfig(configPath));

    default:
      return [];
  }
}

/** Import all MCP servers from a specific AI client's config */
export async function importServersFromClient(clientType: ClientType): Promise<ImportResult> {
  const configPath = getClientConfigPath(clientType);

  if (!configPath) {
    return { clientType, servers: [], error: `No config path for ${clientType} on this platform` };
  }

  try {
    const servers = await readClientConfig(clientType, configPath);
    return { clientType, servers };
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return { clientType, servers: [], error: 'Config file not found' };
    }
    return { clientType, servers: [], error: err.message || String(err) };
  }
}

/** Import from all detected clients at once */
export async function importServersFromAllClients(): Promise<ImportResult[]> {
  const allTypes = Object.values(ClientType);
  const results = await Promise.allSettled(
    allTypes.map((ct) => importServersFromClient(ct))
  );
  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { clientType: ClientType.ClaudeDesktop, servers: [], error: String(r.reason) }
  );
}

// Export individual importers for testing
export {
  importFromStandardJson,
  importFromZed,
  importFromOpenCode,
  importFromCody,
  importFromContinueDev,
  importFromGoose,
  importFromJetBrains,
};

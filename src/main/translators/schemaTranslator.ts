import { McpServer, ClientType } from '../../shared/types.js';

/**
 * Translates a generic McpServer object into a client-specific config fragment,
 * and provides the section key / write strategy for each AI client.
 */

export interface TranslatedConfig {
  sectionKey: string;
  serverName: string;
  config: any;
  format: 'json' | 'jsonc' | 'yaml-map' | 'yaml-array' | 'xml';
}

// --- Standard JSON format (Claude Desktop, Cursor, Windsurf, VS Code Cline) ---

function translateStandard(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      url: server.url,
      ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
    };
  }
  return {
    command: server.command,
    args: server.args,
    ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
  };
}

// --- Zed Editor: uses `context_servers`, same shape as standard ---

function translateZed(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      url: server.url,
      ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
    };
  }
  return {
    command: server.command,
    args: server.args,
    ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
  };
}

// --- Continue.dev: YAML array with `name` field ---

function translateContinueDev(server: McpServer): any {
  const entry: any = { name: server.name };
  if (server.transportType === 'sse') {
    entry.url = server.url;
  } else {
    entry.command = server.command;
    entry.args = server.args;
  }
  if (Object.keys(server.env).length > 0) {
    entry.env = { ...server.env };
  }
  return entry;
}

// --- OpenCode AI: JSONC, type:"local", command=[cmd, ...args], environment ---

function translateOpenCode(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      type: 'remote',
      url: server.url,
      ...(Object.keys(server.env).length > 0 ? { environment: server.env } : {}),
      enabled: true,
    };
  }
  return {
    type: 'local',
    command: [server.command, ...server.args],
    ...(Object.keys(server.env).length > 0 ? { environment: server.env } : {}),
    enabled: true,
  };
}

// --- Sourcegraph Cody: uses `cody.mcpServers` key ---

function translateCody(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      url: server.url,
      ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
    };
  }
  return {
    command: server.command,
    args: server.args,
    env: server.env || {},
  };
}

// --- Goose (Block): YAML, `extensions` key, uses `cmd` and `envs` ---

function translateGoose(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      uri: server.url,
      ...(Object.keys(server.env).length > 0 ? { envs: server.env } : {}),
    };
  }
  return {
    cmd: server.command,
    args: server.args,
    ...(Object.keys(server.env).length > 0 ? { envs: server.env } : {}),
  };
}

// --- Copilot CLI: JSON with `tools`, `type`, `source` fields ---

function translateCopilotCli(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      tools: ['*'],
      type: 'http',
      url: server.url,
      headers: {},
      source: 'user',
    };
  }
  return {
    tools: ['*'],
    type: 'local',
    command: server.command,
    args: server.args,
    ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
    source: 'user',
  };
}

// --- Junie: standard JSON with explicit `type` field ---

function translateJunie(server: McpServer): any {
  if (server.transportType === 'sse') {
    return {
      type: 'sse',
      url: server.url,
      ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
    };
  }
  return {
    type: 'stdio',
    command: server.command,
    args: server.args,
    ...(Object.keys(server.env).length > 0 ? { env: server.env } : {}),
  };
}

// --- JetBrains: XML format, special handling ---

export interface JetBrainsTranslated {
  serverName: string;
  command: string;
  args: string;
}

function sanitizeJetBrainsArg(arg: string): string {
  if (arg.includes(' ') && !arg.startsWith('"')) {
    return `"${arg}"`;
  }
  return arg;
}

function translateJetBrains(server: McpServer): JetBrainsTranslated {
  return {
    serverName: server.name,
    command: server.command,
    args: server.args.map(sanitizeJetBrainsArg).join(' '),
  };
}

// --- Main translate function ---

export function translateForClient(server: McpServer, clientType: ClientType): TranslatedConfig {
  switch (clientType) {
    case ClientType.ClaudeDesktop:
    case ClientType.Cursor:
    case ClientType.Windsurf:
    case ClientType.VSCodeCline:
    case ClientType.GeminiCli:
      return {
        sectionKey: 'mcpServers',
        serverName: server.name,
        config: translateStandard(server),
        format: 'json',
      };

    case ClientType.CopilotCli:
      return {
        sectionKey: 'mcpServers',
        serverName: server.name,
        config: translateCopilotCli(server),
        format: 'json',
      };

    case ClientType.Junie:
      return {
        sectionKey: 'mcpServers',
        serverName: server.name,
        config: translateJunie(server),
        format: 'json',
      };

    case ClientType.Zed:
      return {
        sectionKey: 'context_servers',
        serverName: server.name,
        config: translateZed(server),
        format: 'jsonc',
      };

    case ClientType.ContinueDev:
      return {
        sectionKey: 'mcpServers',
        serverName: server.name,
        config: translateContinueDev(server),
        format: 'yaml-array',
      };

    case ClientType.OpenCode:
      return {
        sectionKey: 'mcp',
        serverName: server.name,
        config: translateOpenCode(server),
        format: 'jsonc',
      };

    case ClientType.SourcegraphCody:
      return {
        sectionKey: 'cody.mcpServers',
        serverName: server.name,
        config: translateCody(server),
        format: 'json',
      };

    case ClientType.Goose:
      return {
        sectionKey: 'extensions',
        serverName: server.name,
        config: translateGoose(server),
        format: 'yaml-map',
      };

    case ClientType.JetBrains: {
      const jb = translateJetBrains(server);
      return {
        sectionKey: 'llm.mcpServers',
        serverName: jb.serverName,
        config: jb,
        format: 'xml',
      };
    }

    default:
      throw new Error(`Unsupported client type: ${clientType}`);
  }
}

export { translateStandard, translateZed, translateContinueDev, translateOpenCode, translateCody, translateGoose, translateCopilotCli, translateJunie, translateJetBrains, sanitizeJetBrainsArg };

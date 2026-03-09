import { ClientType, DetectedClient } from '../../shared/types.js';
import * as fs from 'fs/promises';
import { readdirSync, statSync } from 'fs';
import * as path from 'path';
import * as os from 'os';

const HOME = os.homedir();
const PLATFORM = process.platform; // 'darwin' | 'linux' | 'win32'

function getAppData(): string {
  return process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
}

function getUserProfile(): string {
  return process.env.USERPROFILE || HOME;
}

const CLIENT_INFO: Record<ClientType, { displayName: string; icon: string }> = {
  [ClientType.ClaudeDesktop]: { displayName: 'Claude Desktop', icon: '🤖' },
  [ClientType.Cursor]: { displayName: 'Cursor', icon: '📝' },
  [ClientType.Windsurf]: { displayName: 'Windsurf IDE', icon: '🏄' },
  [ClientType.Zed]: { displayName: 'Zed Editor', icon: '⚡' },
  [ClientType.ContinueDev]: { displayName: 'Continue.dev', icon: '🔄' },
  [ClientType.OpenCode]: { displayName: 'OpenCode AI', icon: '💻' },
  [ClientType.SourcegraphCody]: { displayName: 'Sourcegraph Cody', icon: '🔍' },
  [ClientType.Goose]: { displayName: 'Goose (Block)', icon: '🪿' },
  [ClientType.VSCodeCline]: { displayName: 'VS Code (Cline/Roo)', icon: '🔵' },
  [ClientType.JetBrains]: { displayName: 'JetBrains IDE', icon: '🧠' },
  [ClientType.CopilotCli]: { displayName: 'Copilot CLI', icon: '🐙' },
  [ClientType.GeminiCli]: { displayName: 'Gemini CLI', icon: '💎' },
  [ClientType.Junie]: { displayName: 'Junie', icon: '🐾' },
};

/**
 * Find the latest JetBrains IDE version directory and return
 * the full path to llm.mcpServers.xml inside it.
 */
function findJetBrainsConfigPath(): string | null {
  let baseDir: string;

  if (PLATFORM === 'darwin') {
    baseDir = path.join(HOME, 'Library', 'Application Support', 'JetBrains');
  } else if (PLATFORM === 'linux') {
    baseDir = path.join(HOME, '.config', 'JetBrains');
  } else if (PLATFORM === 'win32') {
    baseDir = path.join(getAppData(), 'JetBrains');
  } else {
    return null;
  }

  try {
    const entries = readdirSync(baseDir, { withFileTypes: true });
    const versionDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        mtime: statSync(path.join(baseDir, e.name)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // most recently modified first

    if (versionDirs.length === 0) return null;

    return path.join(baseDir, versionDirs[0].name, 'options', 'llm.mcpServers.xml');
  } catch {
    // Base directory doesn't exist — return a sensible default path
    return path.join(baseDir, 'IntelliJIdea', 'options', 'llm.mcpServers.xml');
  }
}

function getConfigPath(clientType: ClientType): string | null {
  if (clientType === ClientType.JetBrains) {
    return findJetBrainsConfigPath();
  }

  switch (clientType) {
    case ClientType.ClaudeDesktop:
      if (PLATFORM === 'darwin')
        return path.join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      if (PLATFORM === 'linux')
        return path.join(HOME, '.config', 'Claude', 'claude_desktop_config.json');
      if (PLATFORM === 'win32')
        return path.join(getAppData(), 'Claude', 'claude_desktop_config.json');
      return null;

    case ClientType.Cursor:
      if (PLATFORM === 'win32')
        return path.join(getUserProfile(), '.cursor', 'mcp.json');
      return path.join(HOME, '.cursor', 'mcp.json');

    case ClientType.Windsurf:
      return path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json');

    case ClientType.Zed:
      if (PLATFORM === 'win32') return null; // Zed not available on Windows
      return path.join(HOME, '.config', 'zed', 'settings.json');

    case ClientType.ContinueDev:
      if (PLATFORM === 'win32')
        return path.join(getUserProfile(), '.continue', 'config.yaml');
      return path.join(HOME, '.continue', 'config.yaml');

    case ClientType.OpenCode:
      return path.join(HOME, '.config', 'opencode', 'opencode.json');

    case ClientType.SourcegraphCody:
      return path.join(HOME, '.config', 'cody', 'mcp_servers.json');

    case ClientType.Goose:
      return path.join(HOME, '.config', 'goose', 'config.yaml');

    case ClientType.VSCodeCline:
      if (PLATFORM === 'darwin')
        return path.join(
          HOME, 'Library', 'Application Support', 'Code', 'User',
          'globalStorage', 'rooveterinaryinc.roo-cline', 'settings',
          'cline_mcp_settings.json',
        );
      if (PLATFORM === 'linux')
        return path.join(
          HOME, '.config', 'Code', 'User',
          'globalStorage', 'rooveterinaryinc.roo-cline', 'settings',
          'cline_mcp_settings.json',
        );
      if (PLATFORM === 'win32')
        return path.join(
          getAppData(), 'Code', 'User',
          'globalStorage', 'rooveterinaryinc.roo-cline', 'settings',
          'cline_mcp_settings.json',
        );
      return null;

    case ClientType.CopilotCli:
      if (PLATFORM === 'win32')
        return path.join(getAppData(), 'github-copilot', 'mcp.json');
      return path.join(HOME, '.config', 'github-copilot', 'mcp.json');

    case ClientType.GeminiCli:
      if (PLATFORM === 'win32')
        return path.join(getUserProfile(), '.gemini', 'settings.json');
      return path.join(HOME, '.gemini', 'settings.json');

    case ClientType.Junie:
      if (PLATFORM === 'win32')
        return path.join(getUserProfile(), '.junie', 'mcp', 'mcp.json');
      return path.join(HOME, '.junie', 'mcp', 'mcp.json');

    default:
      return null;
  }
}

/** Detect all supported AI clients and their installation status. */
export async function detectClients(): Promise<DetectedClient[]> {
  const results: DetectedClient[] = [];

  for (const clientType of Object.values(ClientType)) {
    const configPath = getConfigPath(clientType);
    if (!configPath) continue;

    let installed = false;
    try {
      await fs.access(configPath);
      installed = true;
    } catch {
      // Config file missing — check if the parent directory exists
      // (client may be installed but no MCP config created yet)
      try {
        await fs.access(path.dirname(configPath));
        installed = true;
      } catch {
        installed = false;
      }
    }

    const info = CLIENT_INFO[clientType];
    results.push({
      clientType,
      displayName: info.displayName,
      configPath,
      installed,
      icon: info.icon,
    });
  }

  return results;
}

/** Get the expected config path for a specific client on this OS. */
export function getClientConfigPath(clientType: ClientType): string | null {
  return getConfigPath(clientType);
}

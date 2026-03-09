// Transport type for MCP servers
export type TransportType = 'stdio' | 'sse';

// Enum of all supported AI client types
export enum ClientType {
  ClaudeDesktop = 'claude-desktop',
  Cursor = 'cursor',
  Windsurf = 'windsurf',
  Zed = 'zed',
  ContinueDev = 'continue-dev',
  OpenCode = 'opencode',
  SourcegraphCody = 'sourcegraph-cody',
  Goose = 'goose',
  VSCodeCline = 'vscode-cline',
  JetBrains = 'jetbrains',
  CopilotCli = 'copilot-cli',
  GeminiCli = 'gemini-cli',
  Junie = 'junie',
}

// A generic MCP server definition (the "single source of truth" format)
export interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  transportType: TransportType;
  url?: string; // For SSE transport
  createdAt: string;
  updatedAt: string;
}

// Input for creating/updating a server (no id, timestamps auto-generated)
export interface McpServerInput {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  transportType: TransportType;
  url?: string;
}

// A sync target: which server is synced to which client
export interface SyncTarget {
  serverId: string;
  clientType: ClientType;
  enabled: boolean;
}

// Result of a sync operation for one client
export interface SyncResult {
  clientType: ClientType;
  success: boolean;
  error?: string;
  backedUp?: boolean;
  backupPath?: string;
  backupSizeBytes?: number;
  configPath?: string;
}

// Detected AI client on the system
export interface DetectedClient {
  clientType: ClientType;
  displayName: string;
  configPath: string;
  installed: boolean;
  icon?: string; // emoji or icon identifier
}

// A tracked config backup
export interface ConfigBackup {
  id: string;
  clientType: ClientType;
  configPath: string;
  backupPath: string;
  sizeBytes: number;
  createdAt: string;
}

// Result of importing servers from a client
export interface ImportResult {
  clientType: ClientType;
  servers: McpServerInput[];
  error?: string;
}

// IPC API exposed to renderer via preload
export interface ElectronAPI {
  getServers: () => Promise<McpServer[]>;
  addServer: (server: McpServerInput) => Promise<McpServer>;
  updateServer: (id: string, server: McpServerInput) => Promise<McpServer>;
  deleteServer: (id: string) => Promise<void>;
  getDetectedClients: () => Promise<DetectedClient[]>;
  getSyncTargets: (serverId: string) => Promise<SyncTarget[]>;
  setSyncTarget: (serverId: string, clientType: ClientType, enabled: boolean) => Promise<void>;
  syncServer: (serverId: string) => Promise<SyncResult[]>;
  syncAll: () => Promise<SyncResult[]>;
  importFromClient: (clientType: ClientType) => Promise<ImportResult>;
  importFromAllClients: () => Promise<ImportResult[]>;
  getBackups: () => Promise<ConfigBackup[]>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
}

// Augment Window interface for preload bridge
declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export interface Metric {
  value: string;
  label: string;
  description: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  accent: string;
  icon: string;
}

export interface ClientCard {
  name: string;
  format: string;
  configKey: string;
  note: string;
}

export const metrics: Metric[] = [
  {
    value: '10',
    label: 'client translators',
    description: 'One control plane for Claude, Cursor, Zed, Continue, JetBrains, and more.',
  },
  {
    value: '1',
    label: 'source of truth',
    description: 'Define each MCP server once and sync it anywhere you need it.',
  },
  {
    value: '0',
    label: 'manual rewrites',
    description: 'Lossless translators preserve client-specific config structures and comments.',
  },
];

export const featureCards: FeatureCard[] = [
  {
    icon: '\u{1F3AF}',
    title: 'Single source of truth',
    description:
      'Manage all MCP servers in one desktop app backed by SQLite, then fan those definitions out to every connected client.',
    accent: 'bg-sky-400/10 text-sky-200 ring-sky-400/30',
  },
  {
    icon: '\u{1F4E5}',
    title: 'Import existing setups',
    description:
      'Scan installed clients, pull in their current server definitions, and normalize them into one coherent registry.',
    accent: 'bg-indigo-400/10 text-indigo-200 ring-indigo-400/30',
  },
  {
    icon: '\u{1F504}',
    title: 'Lossless translation',
    description:
      'Preserve JSONC comments, YAML formatting, and client-specific schema requirements while still keeping data centralized.',
    accent: 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/30',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    title: 'Safe sync engine',
    description:
      'Create backups before writes, retry transient file-lock errors, and keep sync behavior predictable across platforms.',
    accent: 'bg-amber-400/10 text-amber-200 ring-amber-400/30',
  },
  {
    icon: '\u{1F39B}\uFE0F',
    title: 'Per-client control',
    description:
      'Toggle each integration independently so every server only ships to the tools where it should actually run.',
    accent: 'bg-fuchsia-400/10 text-fuchsia-200 ring-fuchsia-400/30',
  },
  {
    icon: '\u2728',
    title: 'Operator-friendly UX',
    description:
      'The React + Tailwind interface keeps server inventory, sync targets, and import workflows easy to reason about.',
    accent: 'bg-cyan-400/10 text-cyan-200 ring-cyan-400/30',
  },
];

export const supportedClients: ClientCard[] = [
  {
    name: 'Claude Desktop',
    format: 'JSON',
    configKey: 'mcpServers',
    note: 'Good for teams standardizing local desktop workflows.',
  },
  {
    name: 'Cursor',
    format: 'JSON',
    configKey: 'mcpServers',
    note: 'Ideal when developers switch between coding assistants daily.',
  },
  {
    name: 'Windsurf IDE',
    format: 'JSON',
    configKey: 'mcpServers',
    note: 'Keeps experimental IDE environments aligned with core tooling.',
  },
  {
    name: 'VS Code (Cline/Roo)',
    format: 'JSON',
    configKey: 'mcpServers',
    note: 'Covers popular extension-driven MCP setups.',
  },
  {
    name: 'Zed Editor',
    format: 'JSONC',
    configKey: 'context_servers',
    note: 'Preserves inline comments while translating configuration safely.',
  },
  {
    name: 'Continue.dev',
    format: 'YAML array',
    configKey: 'mcpServers',
    note: 'Keeps YAML-based agent workflows tidy and consistent.',
  },
  {
    name: 'OpenCode AI',
    format: 'JSONC',
    configKey: 'mcp',
    note: 'Supports local command and environment-driven server entries.',
  },
  {
    name: 'Sourcegraph Cody',
    format: 'JSON',
    configKey: 'cody.mcpServers',
    note: 'Useful for broader code intelligence workflows with shared MCP tools.',
  },
  {
    name: 'Goose (Block)',
    format: 'YAML map',
    configKey: 'extensions',
    note: 'Maps command and environment fields into Goose-compatible entries.',
  },
  {
    name: 'JetBrains IDEs',
    format: 'XML',
    configKey: 'llm.mcpServers',
    note: 'Handles XML quoting edge cases so server commands stay valid.',
  },
];

export const quickstartCommands = `git clone https://github.com/Hiosdra/MCP-manager.git
cd MCP-manager
npm install
npm run dev`;

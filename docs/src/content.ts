export interface Metric {
  value: string;
  label: string;
  description: string;
}

export interface ProblemCard {
  title: string;
  description: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  accent: string;
}

export interface ClientCard {
  name: string;
  format: string;
  configKey: string;
  note: string;
}

export interface WorkflowStep {
  title: string;
  description: string;
}

export interface ArchitectureLayer {
  title: string;
  description: string;
  bullets: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Clients', href: '#supported-clients' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Quickstart', href: '#quickstart' },
  { label: 'FAQ', href: '#faq' },
];

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

export const problemCards: ProblemCard[] = [
  {
    title: 'Fragmented configuration',
    description:
      'Every AI client stores MCP settings in a different path, format, and schema, which turns simple updates into repetitive maintenance.',
  },
  {
    title: 'Risky manual edits',
    description:
      'Editing JSON, JSONC, YAML, or XML by hand makes backups, quoting, and validation your responsibility instead of the tool’s.',
  },
  {
    title: 'Tooling drift',
    description:
      'As teams experiment with more MCP-enabled tools, configs drift apart quickly and servers stop behaving consistently.',
  },
];

export const featureCards: FeatureCard[] = [
  {
    title: 'Single source of truth',
    description:
      'Manage all MCP servers in one desktop app backed by SQLite, then fan those definitions out to every connected client.',
    accent: 'bg-sky-400/10 text-sky-200 ring-sky-400/30',
  },
  {
    title: 'Import existing setups',
    description:
      'Scan installed clients, pull in their current server definitions, and normalize them into one coherent registry.',
    accent: 'bg-indigo-400/10 text-indigo-200 ring-indigo-400/30',
  },
  {
    title: 'Lossless translation',
    description:
      'Preserve JSONC comments, YAML formatting, and client-specific schema requirements while still keeping data centralized.',
    accent: 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/30',
  },
  {
    title: 'Safe sync engine',
    description:
      'Create backups before writes, retry transient file-lock errors, and keep sync behavior predictable across platforms.',
    accent: 'bg-amber-400/10 text-amber-200 ring-amber-400/30',
  },
  {
    title: 'Per-client control',
    description:
      'Toggle each integration independently so every server only ships to the tools where it should actually run.',
    accent: 'bg-fuchsia-400/10 text-fuchsia-200 ring-fuchsia-400/30',
  },
  {
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

export const workflowSteps: WorkflowStep[] = [
  {
    title: 'Define servers once',
    description:
      'Add a server in MCP Manager with its command, args, environment, and per-client sync preferences.',
  },
  {
    title: 'Inspect and import',
    description:
      'Scan installed clients, detect existing configs, and import them into the local database instead of starting from scratch.',
  },
  {
    title: 'Sync with confidence',
    description:
      'Run the sync engine to translate, back up, and write client-specific configuration files wherever they belong.',
  },
];

export const architectureLayers: ArchitectureLayer[] = [
  {
    title: 'Electron main process',
    description:
      'Coordinates repositories, sync workflows, client detection, and all file-system operations behind a secure boundary.',
    bullets: ['SQLite-backed persistence', 'IPC handlers', 'backup and retry orchestration'],
  },
  {
    title: 'Translator and parser layer',
    description:
      'Converts the canonical MCP server definition into the exact schema each AI client expects.',
    bullets: ['JSON + JSONC support', 'YAML mapping', 'XML output for JetBrains'],
  },
  {
    title: 'React renderer',
    description:
      'Provides the operational interface for managing servers, imports, and integrations without exposing unsafe filesystem access.',
    bullets: ['Dashboard and sync hub', 'Server form flows', 'Tailwind-based UI'],
  },
];

export const faqItems: FaqItem[] = [
  {
    question: 'Does MCP Manager modify my client configs directly?',
    answer:
      'Yes, but safely. The sync engine creates a backup of every config file before writing, and translators preserve existing formatting, comments, and client-specific fields.',
  },
  {
    question: 'Can I use it with clients that are not listed yet?',
    answer:
      'The translator layer is designed to be extensible. Adding support for a new client means implementing a translator that maps the canonical server definition to the target format.',
  },
  {
    question: 'Do I need to install anything beyond Node.js?',
    answer:
      'No. The project uses Electron, React, Vite, and Tailwind — all managed through npm. Just run npm install and you are ready to go.',
  },
];

export const architectureDiagram = `Electron main process
  |- SQLite repository
  |- Client detection and import
  |- Sync engine
  \`- Translators and parsers
         |
         v
  preload bridge and IPC boundary
         |
         v
    React management UI
         |
         v
AI client configs written in JSON, JSONC, YAML, and XML`;

export const quickstartCommands = `npm install
npm run dev
npm run build
npm test`;

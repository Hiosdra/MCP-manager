# MCP Manager

Centralized configuration manager for Model Context Protocol (MCP) servers. Define your MCP servers once, sync them to all your AI clients automatically.

## Problem

Every AI client (Claude Desktop, Cursor, Zed, Continue.dev, etc.) maintains its own MCP config file in a different format and location. MCP Manager acts as a **single source of truth** — you configure servers once and sync to all clients with one click.

## Supported Clients

| Client | Format | Config Key |
|---|---|---|
| Claude Desktop | JSON | `mcpServers` |
| Cursor | JSON | `mcpServers` |
| Windsurf IDE | JSON | `mcpServers` |
| VS Code (Cline/Roo) | JSON | `mcpServers` |
| Zed Editor | JSONC | `context_servers` |
| Continue.dev | YAML (array) | `mcpServers` |
| OpenCode AI | JSONC | `mcp` (type: local, environment) |
| Sourcegraph Cody | JSON | `cody.mcpServers` |
| Goose (Block) | YAML (map) | `extensions` (cmd, envs) |
| JetBrains IDEs | XML | `llm.mcpServers` |

## Architecture

```
┌─────────────────────────────────────────┐
│           Electron (Main Process)        │
│  ┌──────────┐  ┌────────────────────┐   │
│  │  SQLite   │  │   Sync Engine      │   │
│  │  Database │  │  backup → translate │   │
│  │  (servers,│  │  → write (retry)   │   │
│  │  targets) │  └────────┬───────────┘   │
│  └──────────┘           │               │
│       │        ┌────────┴──────────┐    │
│       │        │ Schema Translators │    │
│       │        │ (10 client formats)│    │
│       │        └────────┬──────────┘    │
│       │                 │               │
│       │        ┌────────┴──────────┐    │
│       │        │     Parsers        │    │
│       │        │ JSON│JSONC│YAML│XML│    │
│       │        └───────────────────┘    │
│  ┌────┴─────────────────────────────┐   │
│  │    IPC Handlers (preload bridge) │   │
│  └──────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │ contextBridge
┌────────────────┴────────────────────────┐
│         Renderer (React + Tailwind)      │
│  Dashboard │ ServerForm │ SyncHub        │
└─────────────────────────────────────────┘
```

## Tech Stack

- **Electron** — desktop shell with secure IPC
- **React 18 + TypeScript** — renderer UI
- **Tailwind CSS** — styling
- **Vite** — bundler for both renderer and main process
- **better-sqlite3** — local database for servers & sync targets
- **jsonc-parser** — lossless JSONC editing (preserves comments)
- **yaml** — AST-based YAML editing (preserves formatting)
- **xml2js** — JetBrains XML config manipulation
- **Vitest** — test framework

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Install & Run

```bash
npm install

# Development (renderer + main + electron)
npm run dev

# Production build
npm run build
```

### Documentation Site

The repository now includes a standalone docs app under `docs/` that is ready to be published as a static site later (for example on GitHub Pages).

```bash
# Run the docs site locally
npm run dev:docs

# Build the static docs output into dist/docs
npm run build:docs
```

### Run Tests

```bash
npm test
```

## Key Features

- **Single Source of Truth** — define servers once in the manager's SQLite database
- **Import from Existing Clients** — scan your AI tools and pull in their existing MCP server configs
- **Lossless Config Editing** — JSONC comments and YAML formatting are preserved
- **Automatic Backup** — `.backup` files created before every config mutation
- **Retry with Exponential Backoff** — handles file locks (EPERM) on Windows
- **JetBrains Path Sanitization** — args containing spaces are auto-quoted for XML
- **Per-client Toggle** — enable/disable sync targets individually per server
- **Client Auto-detection** — scans OS-specific paths to find installed AI clients

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts              # App entry, IPC handlers
│   ├── preload.ts           # contextBridge (secure IPC)
│   ├── database/            # SQLite schema & repository
│   ├── parsers/             # JSON, JSONC, YAML, XML parsers
│   ├── translators/         # Schema translators (10 clients)
│   ├── sync/                # Sync engine (backup, translate, write)
│   └── utils/               # Client detector, path mapping
├── renderer/                # React frontend
│   ├── App.tsx              # Main app with navigation
│   ├── components/          # Dashboard, ServerForm, SyncHub, StatusBar
│   └── hooks/               # useServers, useDetectedClients, useSync
└── shared/
    └── types.ts             # Shared TypeScript types & interfaces

docs/
├── index.html               # Static docs entry
├── src/                     # React-powered documentation site
└── vite.config.ts           # Standalone docs build config

tests/
├── schemaTranslator.test.ts # 23 tests — all 10 client formats
├── parsers.test.ts          # 22 tests — JSON, JSONC, YAML, XML
├── serverRepository.test.ts # 12 tests — CRUD + sync targets
└── syncEngine.test.ts       # 11 tests — end-to-end sync + backup
```

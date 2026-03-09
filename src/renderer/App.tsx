import { useState, useCallback } from 'react';
import { McpServer, McpServerInput } from '../shared/types';
import { useServers, useDetectedClients } from './hooks/useApi';
import Dashboard from './components/Dashboard';
import ServerForm from './components/ServerForm';
import SyncHub from './components/SyncHub';
import StatusBar from './components/StatusBar';
import ImportDialog from './components/ImportDialog';
import Onboarding, { useOnboarding } from './components/Onboarding';

type View = 'dashboard' | 'sync-hub';

interface SyncContext {
  serverId: string;
  serverName: string;
}

export default function App() {
  const { servers, loading, error, refresh } = useServers();
  const { clients } = useDetectedClients();
  const [view, setView] = useState<View>('dashboard');
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncContext, setSyncContext] = useState<SyncContext | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const { showOnboarding, dismissOnboarding } = useOnboarding();

  const handleAddServer = () => {
    setEditingServer(null);
    setShowForm(true);
  };

  const handleEditServer = (server: McpServer) => {
    setEditingServer(server);
    setShowForm(true);
  };

  const handleDeleteServer = useCallback(async (id: string) => {
    try {
      await window.api.deleteServer(id);
      refresh();
    } catch (err) {
      console.error('Failed to delete server:', err);
    }
  }, [refresh]);

  const handleFormSave = () => {
    setShowForm(false);
    setEditingServer(null);
    refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingServer(null);
  };

  const handleManageSync = (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;
    setSyncContext({ serverId, serverName: server.name });
    setView('sync-hub');
  };

  const handleBackFromSync = () => {
    setSyncContext(null);
    setView('dashboard');
  };

  const handleImport = async (serversToImport: McpServerInput[]) => {
    for (const server of serversToImport) {
      try {
        await window.api.addServer(server);
      } catch (err) {
        console.error(`Failed to import server "${server.name}":`, err);
      }
    }
    setShowImport(false);
    refresh();
  };

  const installedClientCount = clients.filter((c) => c.installed).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="flex items-center justify-between pl-20 pr-5 h-12 border-b border-zinc-800/60 bg-zinc-950 app-drag-region">
        <div className="flex items-center gap-6 no-drag">
          <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">MCP Manager</h1>
          <nav className="flex items-center gap-0.5" aria-label="Main navigation">
            <button
              onClick={() => { setView('dashboard'); setSyncContext(null); }}
              aria-label="Servers"
              aria-current={view === 'dashboard' ? 'page' : undefined}
              className={`px-3 py-1 text-[13px] font-medium rounded-md transition-colors ${
                view === 'dashboard'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Servers
            </button>
            <button
              onClick={() => { setView('sync-hub'); setSyncContext(null); }}
              aria-label="Integrations"
              aria-current={view === 'sync-hub' && !syncContext ? 'page' : undefined}
              className={`px-3 py-1 text-[13px] font-medium rounded-md transition-colors ${
                view === 'sync-hub' && !syncContext
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Integrations
            </button>
          </nav>
        </div>
        {view === 'dashboard' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              aria-label="Import servers"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import
            </button>
            <button
              onClick={handleAddServer}
              aria-label="Add server"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Server
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="mx-6 mt-4 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' && (
          <Dashboard
            servers={servers}
            loading={loading}
            onAdd={handleAddServer}
            onEdit={handleEditServer}
            onDelete={handleDeleteServer}
            onManageSync={handleManageSync}
          />
        )}
        {view === 'sync-hub' && (
          <SyncHub
            serverId={syncContext?.serverId}
            serverName={syncContext?.serverName}
            onBack={syncContext ? handleBackFromSync : undefined}
          />
        )}
      </main>

      <StatusBar
        serverCount={servers.length}
        clientCount={installedClientCount}
        lastSyncTime={lastSyncTime}
      />

      {showForm && (
        <ServerForm
          server={editingServer ?? undefined}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {showImport && (
        <ImportDialog
          existingServerNames={servers.map((s) => s.name)}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
    </div>
  );
}

import { useState, useCallback } from 'react';
import { McpServer, McpServerInput } from '../shared/types';
import { useServers, useDetectedClients } from './hooks/useApi';
import Dashboard from './components/Dashboard';
import ServerForm from './components/ServerForm';
import SyncHub from './components/SyncHub';
import StatusBar from './components/StatusBar';
import ImportDialog from './components/ImportDialog';

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
    <div className="min-h-screen bg-[#0b1121] text-white flex flex-col">
      {/* Navigation bar */}
      <header className="glass-header flex items-center justify-between pl-20 pr-6 py-3 app-drag-region">
        <div className="flex items-center gap-4 no-drag">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="gradient-text">MCP</span> <span className="text-slate-200">Manager</span>
          </h1>
          <nav className="flex items-center gap-1 ml-4" aria-label="Main navigation">
            <button
              onClick={() => { setView('dashboard'); setSyncContext(null); }}
              aria-label="Servers"
              aria-current={view === 'dashboard' ? 'page' : undefined}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                view === 'dashboard'
                  ? 'nav-pill-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Servers
            </button>
            <button
              onClick={() => { setView('sync-hub'); setSyncContext(null); }}
              aria-label="Integrations"
              aria-current={view === 'sync-hub' && !syncContext ? 'page' : undefined}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                view === 'sync-hub' && !syncContext
                  ? 'nav-pill-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Integrations
            </button>
          </nav>
        </div>
        {view === 'dashboard' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowImport(true)}
              aria-label="Import servers"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all duration-200 border border-white/5 hover:border-white/10"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import
            </button>
            <button
              onClick={handleAddServer}
              aria-label="Add server"
              className="btn-gradient flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Server
            </button>
          </div>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 bg-red-500/8 border border-red-500/20 rounded-xl p-3.5 text-sm text-red-300 backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0b1121] to-[#0f1729]">
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

      {/* Status bar */}
      <StatusBar
        serverCount={servers.length}
        clientCount={installedClientCount}
        lastSyncTime={lastSyncTime}
      />

      {/* Server form modal */}
      {showForm && (
        <ServerForm
          server={editingServer ?? undefined}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Import dialog */}
      {showImport && (
        <ImportDialog
          existingServerNames={servers.map((s) => s.name)}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

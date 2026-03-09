import { useState, useCallback } from 'react';
import { McpServer } from '../shared/types';
import { useServers, useDetectedClients } from './hooks/useApi';
import Dashboard from './components/Dashboard';
import ServerForm from './components/ServerForm';
import SyncHub from './components/SyncHub';
import StatusBar from './components/StatusBar';

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

  const installedClientCount = clients.filter((c) => c.installed).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navigation bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">MCP</span> Manager
          </h1>
          <nav className="flex items-center gap-1 ml-4">
            <button
              onClick={() => { setView('dashboard'); setSyncContext(null); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'dashboard'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Servers
            </button>
            <button
              onClick={() => { setView('sync-hub'); setSyncContext(null); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'sync-hub' && !syncContext
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Integrations
            </button>
          </nav>
        </div>
        {view === 'dashboard' && (
          <button
            onClick={handleAddServer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Server
          </button>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' && (
          <Dashboard
            servers={servers}
            loading={loading}
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
    </div>
  );
}

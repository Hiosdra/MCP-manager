import { useState, useEffect, useCallback } from 'react';
import { DetectedClient, SyncTarget, SyncResult, ClientType } from '../../shared/types';
import { useDetectedClients, useSync } from '../hooks/useApi';

interface SyncHubProps {
  serverId?: string;
  serverName?: string;
  onBack?: () => void;
}

const CLIENT_ICONS: Record<string, string> = {
  [ClientType.ClaudeDesktop]: '🤖',
  [ClientType.Cursor]: '⚡',
  [ClientType.Windsurf]: '🏄',
  [ClientType.Zed]: '⚙️',
  [ClientType.ContinueDev]: '🔄',
  [ClientType.OpenCode]: '📝',
  [ClientType.SourcegraphCody]: '🔍',
  [ClientType.Goose]: '🪿',
  [ClientType.VSCodeCline]: '💻',
  [ClientType.JetBrains]: '🧠',
};

export default function SyncHub({ serverId, serverName, onBack }: SyncHubProps) {
  const { clients, loading: clientsLoading } = useDetectedClients();
  const { syncing, results, error: syncError, syncServer, syncAll, clearResults } = useSync();
  const [syncTargets, setSyncTargets] = useState<Map<string, boolean>>(new Map());
  const [toggling, setToggling] = useState<string | null>(null);

  // Load sync targets for the given server
  useEffect(() => {
    if (!serverId) return;
    const loadTargets = async () => {
      try {
        const targets = await window.api.getSyncTargets(serverId);
        const map = new Map<string, boolean>();
        targets.forEach((t) => map.set(t.clientType, t.enabled));
        setSyncTargets(map);
      } catch (err) {
        console.error('Failed to load sync targets:', err);
      }
    };
    loadTargets();
  }, [serverId]);

  const handleToggle = useCallback(
    async (clientType: ClientType) => {
      if (!serverId) return;
      const currentEnabled = syncTargets.get(clientType) ?? false;
      const newEnabled = !currentEnabled;

      setToggling(clientType);
      try {
        await window.api.setSyncTarget(serverId, clientType, newEnabled);
        setSyncTargets((prev) => {
          const updated = new Map(prev);
          updated.set(clientType, newEnabled);
          return updated;
        });
      } catch (err) {
        console.error('Failed to toggle sync target:', err);
      } finally {
        setToggling(null);
      }
    },
    [serverId, syncTargets]
  );

  const handleSync = async () => {
    clearResults();
    if (serverId) {
      await syncServer(serverId);
    } else {
      await syncAll();
    }
  };

  const getResultForClient = (clientType: ClientType): SyncResult | undefined =>
    results?.find((r) => r.clientType === clientType);

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Detecting clients…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {serverId ? 'Client Sync' : 'Integrations'}
            </h1>
            {serverName && (
              <p className="text-sm text-gray-400 mt-0.5">
                Managing sync for <span className="text-blue-400">{serverName}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {serverId ? 'Sync Now' : 'Sync All'}
            </>
          )}
        </button>
      </div>

      {/* Sync error */}
      {syncError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
          {syncError}
        </div>
      )}

      {/* Sync results summary */}
      {results && results.length > 0 && (
        <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sync Results</h3>
          <div className="space-y-1">
            {results.map((r) => (
              <div key={r.clientType} className="flex items-center gap-2 text-sm">
                {r.success ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <span className="text-red-400">✗</span>
                )}
                <span className="text-gray-300">{r.clientType}</span>
                {r.error && <span className="text-red-400 text-xs">— {r.error}</span>}
                {r.backedUp && <span className="text-yellow-500 text-xs">(backed up)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No clients detected</h2>
          <p className="text-gray-500">Install a supported AI client to enable syncing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => {
            const isEnabled = syncTargets.get(client.clientType) ?? false;
            const result = getResultForClient(client.clientType);
            const icon = client.icon || CLIENT_ICONS[client.clientType] || '🔧';

            return (
              <div
                key={client.clientType}
                className="flex items-center justify-between bg-gray-800 rounded-lg border border-gray-700 px-4 py-3 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{client.displayName}</span>
                      {client.installed ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          Installed
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-600 text-gray-400">
                          Not found
                        </span>
                      )}
                      {result && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            result.success
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {result.success ? 'Synced' : 'Failed'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                      {client.configPath}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                {serverId && client.installed && (
                  <button
                    onClick={() => handleToggle(client.clientType)}
                    disabled={toggling === client.clientType}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      isEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    } ${toggling === client.clientType ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

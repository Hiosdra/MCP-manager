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
  [ClientType.CopilotCli]: '🐙',
  [ClientType.GeminiCli]: '💎',
  [ClientType.Junie]: '🐾',
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
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-lg font-medium text-zinc-100">
              {serverId ? 'Client Sync' : 'Integrations'}
            </h1>
            {serverName && (
              <p className="text-[13px] text-zinc-500 mt-0.5">
                Managing sync for <span className="text-zinc-300 font-medium">{serverName}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {serverId ? 'Sync Now' : 'Sync All'}
            </>
          )}
        </button>
      </div>

      {syncError && (
        <div className="mb-4 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {syncError}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mb-5 bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-fade-in">
          <h3 className="text-sm font-medium text-zinc-200 mb-3">Sync Results</h3>
          <div className="space-y-1.5">
            {results.map((r) => (
              <div key={r.clientType} className="flex items-center gap-2.5 text-sm">
                {r.success ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-red-500/15 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
                <span className="text-zinc-300">{r.clientType}</span>
                {r.error && <span className="text-red-400 text-xs">— {r.error}</span>}
                {r.backedUp && <span className="text-amber-400 text-xs">(backed up)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-zinc-300 mb-1">No clients detected</h2>
          <p className="text-zinc-500 text-sm">Install a supported AI client to enable syncing.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {(() => {
            const sorted = [...clients].sort((a, b) => Number(b.installed) - Number(a.installed));
            const installed = sorted.filter(c => c.installed);
            const notInstalled = sorted.filter(c => !c.installed);
            return (
              <>
                {installed.length > 0 && (
                  <>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 px-1 pb-1 pt-1">
                      Installed
                    </p>
                    {installed.map((client) => {
                      const isEnabled = syncTargets.get(client.clientType) ?? false;
                      const result = getResultForClient(client.clientType);
                      const icon = client.icon || CLIENT_ICONS[client.clientType] || '🔧';

                      return (
                        <div
                          key={client.clientType}
                          className="flex items-center justify-between rounded-xl px-4 py-3 bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg">
                              {icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-200 text-sm">{client.displayName}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                <span className="text-[11px] text-emerald-500 font-medium">Installed</span>
                                {result && (
                                  <span className={`text-[11px] font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    · {result.success ? 'Synced' : 'Failed'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-sm font-mono">
                                {client.configPath}
                              </p>
                            </div>
                          </div>

                          {serverId && (
                            <button
                              onClick={() => handleToggle(client.clientType)}
                              disabled={toggling === client.clientType}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                                isEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                              } ${toggling === client.clientType ? 'opacity-50' : ''}`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  isEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
                {notInstalled.length > 0 && (
                  <>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-700 px-1 pb-1 pt-4">
                      Not installed
                    </p>
                    {notInstalled.map((client) => {
                      const icon = client.icon || CLIENT_ICONS[client.clientType] || '🔧';

                      return (
                        <div
                          key={client.clientType}
                          className="flex items-center justify-between rounded-xl px-4 py-3 opacity-40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800/50 flex items-center justify-center text-lg grayscale">
                              {icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-400 text-sm">{client.displayName}</span>
                                <span className="text-[11px] text-zinc-600 font-medium">Not found</span>
                              </div>
                              <p className="text-xs text-zinc-700 mt-0.5 truncate max-w-sm font-mono">
                                {client.configPath}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

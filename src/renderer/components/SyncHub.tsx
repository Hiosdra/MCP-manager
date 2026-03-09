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
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              {serverId ? 'Client Sync' : 'Integrations'}
            </h1>
            {serverName && (
              <p className="text-sm text-slate-500 mt-0.5">
                Managing sync for <span className="text-indigo-400 font-medium">{serverName}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-gradient-green flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
              </div>
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
        <div className="mb-4 bg-red-500/8 border border-red-500/20 rounded-xl p-3.5 text-sm text-red-300">
          {syncError}
        </div>
      )}

      {/* Sync results summary */}
      {results && results.length > 0 && (
        <div className="mb-5 card-glow rounded-xl p-4 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Sync Results</h3>
          <div className="space-y-1.5">
            {results.map((r) => (
              <div key={r.clientType} className="flex items-center gap-2.5 text-sm">
                {r.success ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
                <span className="text-slate-300">{r.clientType}</span>
                {r.error && <span className="text-red-400 text-xs">— {r.error}</span>}
                {r.backedUp && <span className="text-amber-400 text-xs">(backed up)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No clients detected</h2>
          <p className="text-slate-500 text-sm">Install a supported AI client to enable syncing.</p>
        </div>
      ) : (
        <div className="space-y-1.5 stagger-children">
          {(() => {
            const sorted = [...clients].sort((a, b) => Number(b.installed) - Number(a.installed));
            const installed = sorted.filter(c => c.installed);
            const notInstalled = sorted.filter(c => !c.installed);
            return (
              <>
                {installed.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1 pb-1 pt-1">
                      Installed
                    </div>
                    {installed.map((client) => {
                      const isEnabled = syncTargets.get(client.clientType) ?? false;
                      const result = getResultForClient(client.clientType);
                      const icon = client.icon || CLIENT_ICONS[client.clientType] || '🔧';

                      return (
                        <div
                          key={client.clientType}
                          className="integration-row flex items-center justify-between rounded-xl px-4 py-3.5"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xl border border-white/5">
                              {icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-medium text-slate-100 text-sm">{client.displayName}</span>
                                <span className="badge-installed text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                  Installed
                                </span>
                                {result && (
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                      result.success
                                        ? 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/20'
                                        : 'bg-red-500/12 text-red-300 border border-red-500/20'
                                    }`}
                                  >
                                    {result.success ? 'Synced' : 'Failed'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm font-mono">
                                {client.configPath}
                              </p>
                            </div>
                          </div>

                          {serverId && (
                            <button
                              onClick={() => handleToggle(client.clientType)}
                              disabled={toggling === client.clientType}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-[#0b1121] ${
                                isEnabled
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_-2px_rgba(99,102,241,0.4)]'
                                  : 'bg-white/10'
                              } ${toggling === client.clientType ? 'opacity-50' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                  isEnabled ? 'translate-x-6' : 'translate-x-1'
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
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-1 pb-1 pt-3">
                      Not installed
                    </div>
                    {notInstalled.map((client) => {
                      const icon = client.icon || CLIENT_ICONS[client.clientType] || '🔧';

                      return (
                        <div
                          key={client.clientType}
                          className="integration-row flex items-center justify-between rounded-xl px-4 py-3.5 opacity-50"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/3 grayscale">
                              {icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-medium text-slate-300 text-sm">{client.displayName}</span>
                                <span className="badge-not-found text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                  Not found
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 truncate max-w-sm font-mono">
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

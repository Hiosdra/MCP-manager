import { useState, useMemo } from 'react';
import { ConfigBackup, ClientType } from '../../shared/types';
import { useBackups } from '../hooks/useApi';

const CLIENT_LABELS: Record<string, string> = {
  [ClientType.ClaudeDesktop]: 'Claude Desktop',
  [ClientType.Cursor]: 'Cursor',
  [ClientType.Windsurf]: 'Windsurf IDE',
  [ClientType.Zed]: 'Zed Editor',
  [ClientType.ContinueDev]: 'Continue.dev',
  [ClientType.OpenCode]: 'OpenCode AI',
  [ClientType.SourcegraphCody]: 'Sourcegraph Cody',
  [ClientType.Goose]: 'Goose',
  [ClientType.VSCodeCline]: 'VS Code (Cline/Roo)',
  [ClientType.JetBrains]: 'JetBrains IDE',
  [ClientType.CopilotCli]: 'Copilot CLI',
  [ClientType.GeminiCli]: 'Gemini CLI',
  [ClientType.Junie]: 'Junie',
};

const CLIENT_ICONS: Record<string, string> = {
  [ClientType.ClaudeDesktop]: '🤖',
  [ClientType.Cursor]: '📝',
  [ClientType.Windsurf]: '🏄',
  [ClientType.Zed]: '⚡',
  [ClientType.ContinueDev]: '🔄',
  [ClientType.OpenCode]: '💻',
  [ClientType.SourcegraphCody]: '🔍',
  [ClientType.Goose]: '🪿',
  [ClientType.VSCodeCline]: '🔵',
  [ClientType.JetBrains]: '🧠',
  [ClientType.CopilotCli]: '🐙',
  [ClientType.GeminiCli]: '💎',
  [ClientType.Junie]: '🐾',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function BackupList() {
  const { backups, loading, error, restoreBackup, deleteBackup, refresh } = useBackups();
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterClient, setFilterClient] = useState<string>('all');

  const clientTypes = useMemo(() => {
    const set = new Set(backups.map((b) => b.clientType));
    return Array.from(set).sort();
  }, [backups]);

  const filtered = useMemo(() => {
    if (filterClient === 'all') return backups;
    return backups.filter((b) => b.clientType === filterClient);
  }, [backups, filterClient]);

  // Group backups by client type
  const grouped = useMemo(() => {
    const map = new Map<string, ConfigBackup[]>();
    for (const b of filtered) {
      const list = map.get(b.clientType) || [];
      list.push(b);
      map.set(b.clientType, list);
    }
    return map;
  }, [filtered]);

  const handleRestore = async (backup: ConfigBackup) => {
    setRestoring(backup.id);
    setFeedback(null);
    try {
      await restoreBackup(backup.id);
      setFeedback({ type: 'success', message: `Restored ${CLIENT_LABELS[backup.clientType] || backup.clientType} config from ${formatDate(backup.createdAt)}` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Restore failed' });
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (backup: ConfigBackup) => {
    setDeleting(backup.id);
    setFeedback(null);
    try {
      await deleteBackup(backup.id);
      setFeedback({ type: 'success', message: 'Backup deleted' });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading backups…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-zinc-100">Config Backups</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {backups.length} backup{backups.length !== 1 ? 's' : ''} available for restoration
          </p>
        </div>
        <div className="flex items-center gap-2">
          {clientTypes.length > 1 && (
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-2.5 py-1.5 text-[13px] rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="all">All clients</option>
              {clientTypes.map((ct) => (
                <option key={ct} value={ct}>
                  {CLIENT_LABELS[ct] || ct}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {feedback && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/8 border border-red-500/20 text-red-400'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {backups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-zinc-300 mb-1">No backups yet</h2>
          <p className="text-zinc-500 text-sm">Backups are created automatically each time you sync a server.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([clientType, clientBackups]) => (
            <div key={clientType}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{CLIENT_ICONS[clientType] || '🔧'}</span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {CLIENT_LABELS[clientType] || clientType}
                </p>
                <span className="text-[11px] text-zinc-600">({clientBackups.length})</span>
              </div>
              <div className="space-y-1">
                {clientBackups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/60 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-200 font-medium">
                          {formatDate(backup.createdAt)}
                        </span>
                        <span className="text-[11px] text-zinc-600 font-mono">
                          {formatBytes(backup.sizeBytes)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-md font-mono">
                        {backup.configPath}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestore(backup)}
                        disabled={restoring === backup.id}
                        className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-md bg-amber-600/15 text-amber-400 hover:bg-amber-600/25 transition-colors disabled:opacity-50"
                        title="Restore this backup"
                      >
                        {restoring === backup.id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        )}
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(backup)}
                        disabled={deleting === backup.id}
                        className="flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Delete this backup"
                      >
                        {deleting === backup.id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

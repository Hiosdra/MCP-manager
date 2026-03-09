import { useState, useMemo } from 'react';
import { McpServer } from '../../shared/types';

interface DashboardProps {
  servers: McpServer[];
  loading: boolean;
  onAdd?: () => void;
  onEdit: (server: McpServer) => void;
  onDelete: (id: string) => void;
  onManageSync: (serverId: string) => void;
}

export default function Dashboard({ servers, loading, onAdd, onEdit, onDelete, onManageSync }: DashboardProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) return servers;
    const q = searchQuery.toLowerCase();
    return servers.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.command.toLowerCase().includes(q) ||
      (s.url && s.url.toLowerCase().includes(q))
    );
  }, [servers, searchQuery]);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <svg className="animate-spin h-6 w-6 text-zinc-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading servers…</span>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-zinc-200 mb-1">No servers yet</h2>
          <p className="text-sm text-zinc-500 mb-5 max-w-xs mx-auto">Add your first MCP server to start managing configurations across clients.</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              aria-label="Add your first server"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Server
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium text-zinc-100">Server Library</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">{servers.length} server{servers.length !== 1 ? 's' : ''} configured</p>
        </div>
        {servers.length > 1 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter servers…"
              aria-label="Filter servers"
              className="w-52 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {filteredServers.length === 0 && searchQuery.trim() && (
        <div className="text-center py-12 text-zinc-500">
          <svg className="w-8 h-8 mx-auto mb-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">No servers matching "<span className="text-zinc-400">{searchQuery}</span>"</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredServers.map((server) => {
          const envCount = Object.keys(server.env).length;
          const cmdText = server.transportType === 'stdio'
            ? `${server.command} ${server.args.join(' ')}`
            : server.url || '';
          return (
            <div
              key={server.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
              data-testid={`server-card-${server.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-100 truncate">{server.name}</h3>
                <span className="text-[11px] font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ml-3">
                  {server.transportType}
                </span>
              </div>

              <div className="mb-3 flex-1">
                <code className="text-xs text-zinc-500 font-mono bg-zinc-950/60 px-3 py-2 rounded-lg break-all line-clamp-2 block leading-relaxed">
                  {cmdText}
                </code>
                {envCount > 0 && (
                  <p className="flex items-center gap-1.5 mt-2 text-xs text-zinc-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {envCount} env var{envCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800/60">
                <button
                  onClick={() => onManageSync(server.id)}
                  aria-label={`Sync ${server.name}`}
                  className="text-[13px] font-medium px-2.5 py-1 rounded-md bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </button>
                <button
                  onClick={() => onEdit(server)}
                  aria-label={`Edit ${server.name}`}
                  className="text-[13px] font-medium px-2.5 py-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  onBlur={() => setConfirmDeleteId(null)}
                  aria-label={confirmDeleteId === server.id ? `Confirm delete ${server.name}` : `Delete ${server.name}`}
                  className={`text-[13px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                    confirmDeleteId === server.id
                      ? 'bg-red-500/15 text-red-400'
                      : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  {confirmDeleteId === server.id ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

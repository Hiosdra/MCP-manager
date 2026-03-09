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
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <span className="text-sm font-medium">Loading servers…</span>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">No servers yet</h2>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">Add your first MCP server to start managing configurations across clients.</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-white"
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
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Server Library</h1>
          <p className="text-xs text-slate-500 mt-0.5">{servers.length} server{servers.length !== 1 ? 's' : ''} configured</p>
        </div>
        {servers.length > 1 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter servers…"
              aria-label="Filter servers"
              className="search-input w-56 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {filteredServers.length === 0 && searchQuery.trim() && (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">No servers matching "<span className="text-slate-400">{searchQuery}</span>"</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filteredServers.map((server) => {
          const envCount = Object.keys(server.env).length;
          const cmdText = server.transportType === 'stdio'
            ? `${server.command} ${server.args.join(' ')}`
            : server.url || '';
          return (
            <div
              key={server.id}
              className="card-glow rounded-xl px-4 py-3.5 flex flex-col"
              data-testid={`server-card-${server.id}`}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center shrink-0">
                  {server.transportType === 'stdio' ? (
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100 truncate">{server.name}</h3>
                </div>
                <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider ${
                  server.transportType === 'stdio' ? 'badge-stdio' : 'badge-sse'
                }`}>
                  {server.transportType}
                </span>
              </div>

              {/* Command */}
              <div className="mb-3 flex-1">
                <code className="code-block text-xs text-slate-400 px-2.5 py-2 rounded-lg break-all line-clamp-2 block leading-relaxed">
                  {cmdText}
                </code>
                {envCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {envCount} env var{envCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => onManageSync(server.id)}
                  aria-label={`Sync ${server.name}`}
                  className="btn-gradient flex-1 text-xs font-medium px-3 py-2 rounded-lg text-white flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </button>
                <button
                  onClick={() => onEdit(server)}
                  aria-label={`Edit ${server.name}`}
                  className="text-xs font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all duration-200 border border-white/5 hover:border-white/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  onBlur={() => setConfirmDeleteId(null)}
                  aria-label={confirmDeleteId === server.id ? `Confirm delete ${server.name}` : `Delete ${server.name}`}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                    confirmDeleteId === server.id
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 border border-white/5 hover:border-white/10'
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

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
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading servers…</span>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-5xl mb-4">📡</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No servers yet</h2>
          <p className="text-gray-500 mb-5">Add your first MCP server to get started.</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold">Server Library</h1>
        {servers.length > 1 && (
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter servers…"
              aria-label="Filter servers"
              className="w-52 bg-gray-800 border border-gray-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {filteredServers.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No servers matching "<span className="text-gray-400">{searchQuery}</span>"</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredServers.map((server) => {
          const envCount = Object.keys(server.env).length;
          const cmdText = server.transportType === 'stdio'
            ? `${server.command} ${server.args.join(' ')}`
            : server.url || '';
          return (
            <div
              key={server.id}
              className="bg-gray-800 rounded-lg border border-gray-700 px-3 py-2.5 hover:border-gray-600 transition-colors group flex flex-col"
              data-testid={`server-card-${server.id}`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-semibold text-white truncate">{server.name}</h3>
                <span
                  className={`shrink-0 px-1.5 py-0.5 text-[11px] font-medium rounded-full leading-tight ${
                    server.transportType === 'stdio'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {server.transportType.toUpperCase()}
                </span>
              </div>

              {/* Details */}
              <div className="mb-2 min-h-[1.5rem]">
                <code className="text-xs text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded break-all line-clamp-2">
                  {cmdText}
                </code>
                {envCount > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {envCount} env var{envCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-gray-700/50 mt-auto">
                <button
                  onClick={() => onManageSync(server.id)}
                  aria-label={`Sync ${server.name}`}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Sync
                </button>
                <button
                  onClick={() => onEdit(server)}
                  aria-label={`Edit ${server.name}`}
                  className="text-xs px-2.5 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  onBlur={() => setConfirmDeleteId(null)}
                  aria-label={confirmDeleteId === server.id ? `Confirm delete ${server.name}` : `Delete ${server.name}`}
                  className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                    confirmDeleteId === server.id
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
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

import { useState } from 'react';
import { McpServer } from '../../shared/types';

interface DashboardProps {
  servers: McpServer[];
  loading: boolean;
  onEdit: (server: McpServer) => void;
  onDelete: (id: string) => void;
  onManageSync: (serverId: string) => void;
}

export default function Dashboard({ servers, loading, onEdit, onDelete, onManageSync }: DashboardProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      <div className="flex items-center justify-center h-full">
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
          <p className="text-gray-500">Add your first MCP server to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h1 className="text-base font-bold mb-2">Server Library</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
        {servers.map((server) => {
          const envCount = Object.keys(server.env).length;
          const cmdText = server.transportType === 'stdio'
            ? `${server.command} ${server.args.join(' ')}`
            : server.url || '';
          return (
            <div
              key={server.id}
              className="bg-gray-800 rounded border border-gray-700 px-2.5 py-2 hover:border-gray-600 transition-colors group flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-xs font-semibold text-white truncate">{server.name}</h3>
                <span
                  className={`shrink-0 px-1.5 py-px text-[10px] font-medium rounded-full leading-tight ${
                    server.transportType === 'stdio'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {server.transportType.toUpperCase()}
                </span>
              </div>

              {/* Details */}
              <div className="mb-1.5 min-h-[1.25rem]">
                <code className="text-[10px] text-gray-400 bg-gray-700/50 px-1 py-px rounded break-all line-clamp-2">
                  {cmdText}
                </code>
                {envCount > 0 && (
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {envCount} env var{envCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-1.5 border-t border-gray-700/50 mt-auto">
                <button
                  onClick={() => onManageSync(server.id)}
                  className="flex-1 text-[11px] px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Sync
                </button>
                <button
                  onClick={() => onEdit(server)}
                  className="text-[11px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  onBlur={() => setConfirmDeleteId(null)}
                  className={`text-[11px] px-2 py-1 rounded transition-colors ${
                    confirmDeleteId === server.id
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {confirmDeleteId === server.id ? '?' : 'Del'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

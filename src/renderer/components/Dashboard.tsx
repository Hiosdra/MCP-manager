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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Server Library</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {servers.map((server) => {
          const envCount = Object.keys(server.env).length;
          return (
            <div
              key={server.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-5 hover:border-gray-600 transition-colors group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">{server.name}</h3>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      server.transportType === 'stdio'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {server.transportType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {server.transportType === 'stdio' ? (
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-500">Command:</span>{' '}
                    <code className="text-gray-300 bg-gray-700/50 px-1.5 py-0.5 rounded text-xs">
                      {server.command} {server.args.join(' ')}
                    </code>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-500">URL:</span>{' '}
                    <code className="text-gray-300 bg-gray-700/50 px-1.5 py-0.5 rounded text-xs break-all">
                      {server.url}
                    </code>
                  </div>
                )}
                {envCount > 0 && (
                  <div className="text-sm text-gray-500">
                    {envCount} env variable{envCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                <button
                  onClick={() => onManageSync(server.id)}
                  className="flex-1 text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Sync
                </button>
                <button
                  onClick={() => onEdit(server)}
                  className="text-sm px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(server.id)}
                  onBlur={() => setConfirmDeleteId(null)}
                  className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                    confirmDeleteId === server.id
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {confirmDeleteId === server.id ? 'Confirm' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

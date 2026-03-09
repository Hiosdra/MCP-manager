import { useState, useCallback } from 'react';
import { DetectedClient, McpServerInput, ClientType, ImportResult } from '../../shared/types';
import { useDetectedClients } from '../hooks/useApi';

interface ImportDialogProps {
  existingServerNames: string[];
  onImport: (servers: McpServerInput[]) => void;
  onClose: () => void;
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

export default function ImportDialog({ existingServerNames, onImport, onClose }: ImportDialogProps) {
  const { clients, loading: clientsLoading } = useDetectedClients();
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ImportResult[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  // All discovered servers flattened with source info
  type DiscoveredServer = McpServerInput & { sourceClient: ClientType; key: string; isDuplicate: boolean };

  const discoveredServers: DiscoveredServer[] = [];
  if (scanResults) {
    for (const result of scanResults) {
      for (const server of result.servers) {
        const key = `${result.clientType}::${server.name}`;
        const isDuplicate = existingServerNames.includes(server.name);
        discoveredServers.push({ ...server, sourceClient: result.clientType, key, isDuplicate });
      }
    }
  }

  const nonDuplicates = discoveredServers.filter((s) => !s.isDuplicate);

  const handleScanAll = useCallback(async () => {
    setScanning(true);
    setScanResults(null);
    setSelected(new Set());
    try {
      const results = await window.api.importFromAllClients();
      setScanResults(results);
      // Auto-select all non-duplicate servers
      const autoSelect = new Set<string>();
      for (const result of results) {
        for (const server of result.servers) {
          const key = `${result.clientType}::${server.name}`;
          if (!existingServerNames.includes(server.name)) {
            autoSelect.add(key);
          }
        }
      }
      setSelected(autoSelect);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  }, [existingServerNames]);

  const handleScanClient = useCallback(async (clientType: ClientType) => {
    setScanning(true);
    try {
      const result = await window.api.importFromClient(clientType);
      setScanResults((prev) => {
        const filtered = (prev ?? []).filter((r) => r.clientType !== clientType);
        return [...filtered, result];
      });
      // Auto-select new non-duplicate servers from this client
      setSelected((prev) => {
        const updated = new Set(prev);
        for (const server of result.servers) {
          const key = `${clientType}::${server.name}`;
          if (!existingServerNames.includes(server.name)) {
            updated.add(key);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  }, [existingServerNames]);

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const updated = new Set(prev);
      if (updated.has(key)) {
        updated.delete(key);
      } else {
        updated.add(key);
      }
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === nonDuplicates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nonDuplicates.map((s) => s.key)));
    }
  };

  const handleImport = async () => {
    const toImport = discoveredServers.filter((s) => selected.has(s.key));
    // Deduplicate by name (keep first occurrence)
    const seen = new Set<string>();
    const unique: McpServerInput[] = [];
    for (const s of toImport) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        unique.push({
          name: s.name,
          command: s.command,
          args: s.args,
          env: s.env,
          transportType: s.transportType,
          ...(s.url ? { url: s.url } : {}),
        });
      }
    }
    setImporting(true);
    onImport(unique);
  };

  const installedClients = clients.filter((c) => c.installed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Import Servers</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Pull existing MCP server configs from your AI clients
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Scan */}
          {!scanResults && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-300">Detected Clients</h3>
                <button
                  onClick={handleScanAll}
                  disabled={scanning || installedClients.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                >
                  {scanning ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Scanning…
                    </>
                  ) : 'Scan All Clients'}
                </button>
              </div>

              {clientsLoading ? (
                <p className="text-gray-500 text-sm">Detecting clients…</p>
              ) : installedClients.length === 0 ? (
                <p className="text-gray-500 text-sm">No AI clients detected on this system.</p>
              ) : (
                <div className="space-y-2">
                  {installedClients.map((client) => (
                    <div
                      key={client.clientType}
                      className="flex items-center justify-between bg-gray-750 rounded-lg border border-gray-700 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{client.icon || CLIENT_ICONS[client.clientType] || '🔧'}</span>
                        <div>
                          <span className="font-medium text-white text-sm">{client.displayName}</span>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{client.configPath}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleScanClient(client.clientType)}
                        disabled={scanning}
                        className="text-xs px-2.5 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50"
                      >
                        Scan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review & Select */}
          {scanResults && (
            <div>
              {/* Errors */}
              {scanResults.filter((r) => r.error).length > 0 && (
                <div className="mb-4 space-y-1">
                  {scanResults.filter((r) => r.error).map((r) => (
                    <div key={r.clientType} className="text-xs text-yellow-400">
                      ⚠ {r.clientType}: {r.error}
                    </div>
                  ))}
                </div>
              )}

              {discoveredServers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <h3 className="text-gray-300 font-medium mb-1">No servers found</h3>
                  <p className="text-gray-500 text-sm">Your AI clients don't have any MCP servers configured.</p>
                  <button
                    onClick={() => setScanResults(null)}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300"
                  >
                    ← Back to scan
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setScanResults(null)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-sm font-medium text-gray-300">
                        Found {discoveredServers.length} server{discoveredServers.length !== 1 ? 's' : ''}
                        {nonDuplicates.length < discoveredServers.length && (
                          <span className="text-gray-500 font-normal ml-1">
                            ({discoveredServers.length - nonDuplicates.length} already in library)
                          </span>
                        )}
                      </h3>
                    </div>
                    {nonDuplicates.length > 1 && (
                      <button
                        onClick={toggleSelectAll}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {selected.size === nonDuplicates.length ? 'Deselect all' : 'Select all'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {discoveredServers.map((server) => {
                      const icon = CLIENT_ICONS[server.sourceClient] || '🔧';
                      const isSelected = selected.has(server.key);

                      return (
                        <div
                          key={server.key}
                          onClick={() => !server.isDuplicate && toggleSelect(server.key)}
                          className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                            server.isDuplicate
                              ? 'bg-gray-800/50 border-gray-700/50 opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-blue-600/10 border-blue-500/40 cursor-pointer'
                                : 'bg-gray-800 border-gray-700 cursor-pointer hover:border-gray-600'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            server.isDuplicate
                              ? 'border-gray-600 bg-gray-700'
                              : isSelected
                                ? 'border-blue-500 bg-blue-600'
                                : 'border-gray-600'
                          }`}>
                            {isSelected && !server.isDuplicate && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          {/* Icon + Source */}
                          <span className="text-lg flex-shrink-0">{icon}</span>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white text-sm truncate">{server.name}</span>
                              {server.isDuplicate && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                                  Already exists
                                </span>
                              )}
                              <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                server.transportType === 'stdio'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}>
                                {server.transportType.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {server.transportType === 'stdio'
                                ? `${server.command} ${server.args.join(' ')}`
                                : server.url}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {scanResults && discoveredServers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <span className="text-sm text-gray-400">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing…' : `Import ${selected.size} Server${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

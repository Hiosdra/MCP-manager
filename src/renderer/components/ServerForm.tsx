import { useState, useEffect, FormEvent } from 'react';
import { McpServer, McpServerInput, TransportType } from '../../shared/types';

interface ServerFormProps {
  server?: McpServer;
  onSave: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  command?: string;
  url?: string;
}

export default function ServerForm({ server, onSave, onCancel }: ServerFormProps) {
  const [name, setName] = useState(server?.name ?? '');
  const [transportType, setTransportType] = useState<TransportType>(server?.transportType ?? 'stdio');
  const [command, setCommand] = useState(server?.command ?? '');
  const [url, setUrl] = useState(server?.url ?? '');
  const [args, setArgs] = useState<string[]>(server?.args ?? []);
  const [env, setEnv] = useState<Array<{ key: string; value: string }>>(
    server ? Object.entries(server.env).map(([key, value]) => ({ key, value })) : []
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Server name is required';
    if (transportType === 'stdio' && !command.trim()) newErrors.command = 'Command is required for stdio transport';
    if (transportType === 'sse' && !url.trim()) newErrors.url = 'URL is required for SSE transport';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveError(null);

    const envRecord: Record<string, string> = {};
    env.forEach(({ key, value }) => {
      if (key.trim()) envRecord[key.trim()] = value;
    });

    const input: McpServerInput = {
      name: name.trim(),
      command: command.trim(),
      args: args.filter((a) => a.trim() !== ''),
      env: envRecord,
      transportType,
      ...(transportType === 'sse' ? { url: url.trim() } : {}),
    };

    try {
      if (server) {
        await window.api.updateServer(server.id, input);
      } else {
        await window.api.addServer(input);
      }
      onSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save server');
    } finally {
      setSaving(false);
    }
  };

  // Arg helpers
  const addArg = () => setArgs([...args, '']);
  const removeArg = (index: number) => setArgs(args.filter((_, i) => i !== index));
  const updateArg = (index: number, value: string) => {
    const updated = [...args];
    updated[index] = value;
    setArgs(updated);
  };

  // Env helpers
  const addEnv = () => setEnv([...env, { key: '', value: '' }]);
  const removeEnv = (index: number) => setEnv(env.filter((_, i) => i !== index));
  const updateEnv = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...env];
    updated[index] = { ...updated[index], [field]: value };
    setEnv(updated);
  };

  const inputClass =
    'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';
  const errorClass = 'text-red-400 text-xs mt-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-label={server ? 'Edit server' : 'Add server'}>
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {server ? 'Edit Server' : 'Add Server'}
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Server Name */}
          <div>
            <label className={labelClass}>Server Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP Server"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          {/* Transport Type */}
          <div>
            <label className={labelClass}>Transport Type</label>
            <select
              value={transportType}
              onChange={(e) => setTransportType(e.target.value as TransportType)}
              className={inputClass}
            >
              <option value="stdio">stdio</option>
              <option value="sse">SSE (Server-Sent Events)</option>
            </select>
          </div>

          {/* Command (stdio) */}
          {transportType === 'stdio' && (
            <div>
              <label className={labelClass}>Command</label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx -y @modelcontextprotocol/server-example"
                className={inputClass}
              />
              {errors.command && <p className={errorClass}>{errors.command}</p>}
            </div>
          )}

          {/* URL (sse) */}
          {transportType === 'sse' && (
            <div>
              <label className={labelClass}>URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:3000/sse"
                className={inputClass}
              />
              {errors.url && <p className={errorClass}>{errors.url}</p>}
            </div>
          )}

          {/* Args */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>Arguments</label>
              <button
                type="button"
                onClick={addArg}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Add argument
              </button>
            </div>
            {args.length === 0 && (
              <p className="text-sm text-gray-500">No arguments added.</p>
            )}
            <div className="space-y-2">
              {args.map((arg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={arg}
                    onChange={(e) => updateArg(i, e.target.value)}
                    placeholder={`Argument ${i + 1}`}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeArg(i)}
                    className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>Environment Variables</label>
              <button
                type="button"
                onClick={addEnv}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Add variable
              </button>
            </div>
            {env.length === 0 && (
              <p className="text-sm text-gray-500">No environment variables added.</p>
            )}
            <div className="space-y-2">
              {env.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.key}
                    onChange={(e) => updateEnv(i, 'key', e.target.value)}
                    placeholder="KEY"
                    className={`${inputClass} w-2/5`}
                  />
                  <span className="text-gray-500">=</span>
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEnv(i, 'value', e.target.value)}
                    placeholder="value"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeEnv(i)}
                    className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Error */}
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : server ? 'Update Server' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

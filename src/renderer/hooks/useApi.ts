import { useState, useEffect, useCallback } from 'react';
import { McpServer, DetectedClient, SyncResult, ConfigBackup } from '../../shared/types';

export function useServers() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.getServers();
      setServers(data);
    } catch (err) {
      console.error('Failed to load servers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { servers, loading, error, refresh };
}

export function useDetectedClients() {
  const [clients, setClients] = useState<DetectedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.getDetectedClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { clients, loading, error, refresh };
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncServer = useCallback(async (serverId: string) => {
    setSyncing(true);
    setError(null);
    setResults(null);
    try {
      const res = await window.api.syncServer(serverId);
      setResults(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setError(msg);
      return [];
    } finally {
      setSyncing(false);
    }
  }, []);

  const syncAll = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setResults(null);
    try {
      const res = await window.api.syncAll();
      setResults(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setError(msg);
      return [];
    } finally {
      setSyncing(false);
    }
  }, []);

  return { syncing, results, error, syncServer, syncAll, clearResults: () => setResults(null) };
}

export function useBackups() {
  const [backups, setBackups] = useState<ConfigBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.getBackups();
      setBackups(data);
    } catch (err) {
      console.error('Failed to load backups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const restoreBackup = useCallback(async (backupId: string) => {
    await window.api.restoreBackup(backupId);
  }, []);

  const deleteBackup = useCallback(async (backupId: string) => {
    await window.api.deleteBackup(backupId);
    await refresh();
  }, [refresh]);

  return { backups, loading, error, refresh, restoreBackup, deleteBackup };
}

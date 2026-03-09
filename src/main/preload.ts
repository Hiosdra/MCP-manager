import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../shared/types.js';

const api: ElectronAPI = {
  getServers: () => ipcRenderer.invoke('get-servers'),
  addServer: (server) => ipcRenderer.invoke('add-server', server),
  updateServer: (id, server) => ipcRenderer.invoke('update-server', id, server),
  deleteServer: (id) => ipcRenderer.invoke('delete-server', id),
  getDetectedClients: () => ipcRenderer.invoke('get-detected-clients'),
  getSyncTargets: (serverId) => ipcRenderer.invoke('get-sync-targets', serverId),
  setSyncTarget: (serverId, clientType, enabled) =>
    ipcRenderer.invoke('set-sync-target', serverId, clientType, enabled),
  syncServer: (serverId) => ipcRenderer.invoke('sync-server', serverId),
  syncAll: () => ipcRenderer.invoke('sync-all'),
  importFromClient: (clientType) => ipcRenderer.invoke('import-from-client', clientType),
  importFromAllClients: () => ipcRenderer.invoke('import-from-all-clients'),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  restoreBackup: (backupId) => ipcRenderer.invoke('restore-backup', backupId),
  deleteBackup: (backupId) => ipcRenderer.invoke('delete-backup', backupId),
};

contextBridge.exposeInMainWorld('api', api);

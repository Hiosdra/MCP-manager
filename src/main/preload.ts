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
};

contextBridge.exposeInMainWorld('api', api);

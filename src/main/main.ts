import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './database/schema.js';
import { ServerRepository } from './database/serverRepository.js';
import { detectClients, getClientConfigPath } from './utils/clientDetector.js';
import { syncServerToClient, syncServerToAllTargets } from './sync/syncEngine.js';
import { McpServerInput, ClientType } from '../shared/types.js';

let mainWindow: BrowserWindow | null = null;
let repo: ServerRepository;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#111827',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  // --- Server CRUD ---
  ipcMain.handle('get-servers', async () => {
    return repo.getAll();
  });

  ipcMain.handle('add-server', async (_event, input: McpServerInput) => {
    return repo.create(input);
  });

  ipcMain.handle('update-server', async (_event, id: string, input: McpServerInput) => {
    return repo.update(id, input);
  });

  ipcMain.handle('delete-server', async (_event, id: string) => {
    repo.delete(id);
  });

  // --- Client detection ---
  ipcMain.handle('get-detected-clients', async () => {
    return detectClients();
  });

  // --- Sync targets ---
  ipcMain.handle('get-sync-targets', async (_event, serverId: string) => {
    return repo.getSyncTargets(serverId);
  });

  ipcMain.handle(
    'set-sync-target',
    async (_event, serverId: string, clientType: ClientType, enabled: boolean) => {
      repo.setSyncTarget(serverId, clientType, enabled);
    }
  );

  // --- Sync operations ---
  ipcMain.handle('sync-server', async (_event, serverId: string) => {
    const server = repo.getById(serverId);
    if (!server) throw new Error(`Server '${serverId}' not found`);

    const targets = repo.getEnabledSyncTargets(serverId);
    if (targets.length === 0) return [];

    const clientTypes = targets.map((t) => t.clientType);
    return syncServerToAllTargets(server, clientTypes);
  });

  ipcMain.handle('sync-all', async () => {
    const allTargets = repo.getAllEnabledSyncTargets();
    const resultsByServer = new Map<string, Promise<any>[]>();

    for (const target of allTargets) {
      const key = target.serverId;
      if (!resultsByServer.has(key)) {
        resultsByServer.set(key, []);
      }
      resultsByServer.get(key)!.push(
        syncServerToClient(target.server, target.clientType)
      );
    }

    const allResults = [];
    for (const promises of resultsByServer.values()) {
      const results = await Promise.all(promises);
      allResults.push(...results);
    }

    return allResults;
  });
}

app.whenReady().then(() => {
  const db = initDatabase();
  repo = new ServerRepository(db);

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

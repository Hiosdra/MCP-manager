import { copyFile, access } from 'fs/promises';
import { McpServer, McpServerInput, ClientType, SyncResult } from '../../shared/types.js';
import { translateForClient, TranslatedConfig } from '../translators/schemaTranslator.js';
import { getClientConfigPath } from '../utils/clientDetector.js';
import {
  modifyJsonSection,
  removeFromJsonSection,
  modifyJsoncSection,
  removeFromJsoncSection,
  modifyYamlSection,
  modifyYamlArraySection,
  removeFromYamlSection,
  removeFromYamlArraySection,
  modifyJetBrainsConfig,
  removeFromJetBrainsConfig,
} from '../parsers/index.js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Create a backup of the config file before mutating it */
async function backupFile(filePath: string): Promise<boolean> {
  if (await fileExists(filePath)) {
    const backupPath = filePath + '.backup';
    await copyFile(filePath, backupPath);
    return true;
  }
  return false;
}

/** Write a translated config to the target client's config file */
async function writeConfig(
  configPath: string,
  translated: TranslatedConfig,
  clientType: ClientType
): Promise<void> {
  switch (translated.format) {
    case 'json':
      // For Cody, the section key contains a dot (cody.mcpServers)
      // but it's actually a top-level key in the JSON, not nested
      await modifyJsonSection(configPath, translated.sectionKey, translated.serverName, translated.config);
      break;

    case 'jsonc':
      // JSONC: use path array for lossless editing
      await modifyJsoncSection(configPath, [translated.sectionKey, translated.serverName], translated.config);
      break;

    case 'yaml-map':
      await modifyYamlSection(configPath, translated.sectionKey, translated.serverName, translated.config);
      break;

    case 'yaml-array':
      await modifyYamlArraySection(configPath, translated.sectionKey, translated.config);
      break;

    case 'xml':
      await modifyJetBrainsConfig(
        configPath,
        translated.config.serverName,
        translated.config.command,
        translated.config.args
      );
      break;

    default:
      throw new Error(`Unknown config format: ${translated.format}`);
  }
}

/** Remove a server from a client's config file */
async function removeConfig(
  configPath: string,
  translated: TranslatedConfig,
  clientType: ClientType
): Promise<void> {
  if (!(await fileExists(configPath))) return;

  switch (translated.format) {
    case 'json':
      await removeFromJsonSection(configPath, translated.sectionKey, translated.serverName);
      break;

    case 'jsonc':
      await removeFromJsoncSection(configPath, [translated.sectionKey, translated.serverName]);
      break;

    case 'yaml-map':
      await removeFromYamlSection(configPath, translated.sectionKey, translated.serverName);
      break;

    case 'yaml-array':
      await removeFromYamlArraySection(configPath, translated.sectionKey, translated.serverName);
      break;

    case 'xml':
      await removeFromJetBrainsConfig(configPath, translated.serverName);
      break;
  }
}

/** Retry wrapper with exponential backoff for file lock issues (EPERM) */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isLockError =
        err.code === 'EPERM' || err.code === 'EACCES' || err.code === 'EBUSY';

      if (isLockError && attempt < MAX_RETRIES - 1) {
        const waitMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[SyncEngine] ${label}: File locked, retry ${attempt + 1}/${MAX_RETRIES} after ${waitMs}ms`);
        await delay(waitMs);
        continue;
      }

      if (isLockError) {
        throw new Error(
          `File is locked by the target application. Close it completely before syncing. (${err.code})`
        );
      }
      throw err;
    }
  }
  throw new Error('Unexpected: retry loop exhausted');
}

/** Sync a single server to a single client */
export async function syncServerToClient(
  server: McpServer,
  clientType: ClientType
): Promise<SyncResult> {
  const configPath = getClientConfigPath(clientType);

  if (!configPath) {
    return {
      clientType,
      success: false,
      error: `No config path available for ${clientType} on this platform`,
    };
  }

  try {
    const translated = translateForClient(server, clientType);

    const backedUp = await withRetry(
      () => backupFile(configPath),
      `backup ${clientType}`
    );

    await withRetry(
      () => writeConfig(configPath, translated, clientType),
      `write ${clientType}`
    );

    return {
      clientType,
      success: true,
      backedUp,
      configPath,
    };
  } catch (err: any) {
    return {
      clientType,
      success: false,
      error: err.message || String(err),
      configPath,
    };
  }
}

/** Remove a server from a single client's config */
export async function unsyncServerFromClient(
  server: McpServer,
  clientType: ClientType
): Promise<SyncResult> {
  const configPath = getClientConfigPath(clientType);

  if (!configPath) {
    return { clientType, success: true };
  }

  try {
    const translated = translateForClient(server, clientType);

    await withRetry(
      () => removeConfig(configPath, translated, clientType),
      `remove ${clientType}`
    );

    return { clientType, success: true, configPath };
  } catch (err: any) {
    return {
      clientType,
      success: false,
      error: err.message || String(err),
      configPath,
    };
  }
}

/** Sync a server to all its enabled targets */
export async function syncServerToAllTargets(
  server: McpServer,
  enabledClientTypes: ClientType[]
): Promise<SyncResult[]> {
  const results = await Promise.allSettled(
    enabledClientTypes.map((ct) => syncServerToClient(server, ct))
  );

  return results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { clientType: ClientType.ClaudeDesktop, success: false, error: String(r.reason) }
  );
}

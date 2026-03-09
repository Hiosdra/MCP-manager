import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export async function readJsonConfig(filePath: string): Promise<any> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

export async function writeJsonConfig(filePath: string, data: any): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const content = JSON.stringify(data, null, 2) + '\n';
  await writeFile(filePath, content, 'utf-8');
}

export async function modifyJsonSection(
  filePath: string,
  sectionKey: string,
  serverName: string,
  serverConfig: any
): Promise<void> {
  const data = await readJsonConfig(filePath);
  if (!data[sectionKey]) {
    data[sectionKey] = {};
  }
  data[sectionKey][serverName] = serverConfig;
  await writeJsonConfig(filePath, data);
}

export async function removeFromJsonSection(
  filePath: string,
  sectionKey: string,
  serverName: string
): Promise<void> {
  const data = await readJsonConfig(filePath);
  if (data[sectionKey] && data[sectionKey][serverName] !== undefined) {
    delete data[sectionKey][serverName];
    await writeJsonConfig(filePath, data);
  }
}

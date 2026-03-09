import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import * as yaml from 'yaml';

export async function readYamlConfig(filePath: string): Promise<any> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return yaml.parse(content) ?? {};
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

export async function readYamlDocument(filePath: string): Promise<yaml.Document> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return yaml.parseDocument(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return new yaml.Document({});
    }
    throw err;
  }
}

export async function writeYamlDocument(filePath: string, doc: yaml.Document): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, doc.toString(), 'utf-8');
}

export async function modifyYamlSection(
  filePath: string,
  sectionKey: string,
  serverName: string,
  serverConfig: any
): Promise<void> {
  const doc = await readYamlDocument(filePath);

  if (!doc.has(sectionKey)) {
    doc.set(sectionKey, doc.createNode({}));
  }

  const section = doc.get(sectionKey) as yaml.YAMLMap;
  section.set(serverName, doc.createNode(serverConfig));

  await writeYamlDocument(filePath, doc);
}

/**
 * Handles array-based YAML sections (e.g. Continue.dev mcpServers).
 * Adds or updates an entry matched by its `name` field.
 */
export async function modifyYamlArraySection(
  filePath: string,
  sectionKey: string,
  serverEntry: any
): Promise<void> {
  const doc = await readYamlDocument(filePath);

  if (!doc.has(sectionKey)) {
    doc.set(sectionKey, doc.createNode([]));
  }

  const section = doc.get(sectionKey);

  if (yaml.isSeq(section)) {
    const existingIndex = section.items.findIndex((item) => {
      if (yaml.isMap(item)) {
        const nameNode = item.get('name');
        return nameNode === serverEntry.name;
      }
      return false;
    });

    const newNode = doc.createNode(serverEntry);

    if (existingIndex >= 0) {
      section.set(existingIndex, newNode);
    } else {
      section.add(newNode);
    }
  }

  await writeYamlDocument(filePath, doc);
}

export async function removeFromYamlSection(
  filePath: string,
  sectionKey: string,
  serverName: string
): Promise<void> {
  const doc = await readYamlDocument(filePath);
  const section = doc.get(sectionKey);

  if (yaml.isMap(section)) {
    section.delete(serverName);
    await writeYamlDocument(filePath, doc);
  }
}

export async function removeFromYamlArraySection(
  filePath: string,
  sectionKey: string,
  serverName: string
): Promise<void> {
  const doc = await readYamlDocument(filePath);
  const section = doc.get(sectionKey);

  if (yaml.isSeq(section)) {
    const index = section.items.findIndex((item) => {
      if (yaml.isMap(item)) {
        return item.get('name') === serverName;
      }
      return false;
    });

    if (index >= 0) {
      section.items.splice(index, 1);
      await writeYamlDocument(filePath, doc);
    }
  }
}

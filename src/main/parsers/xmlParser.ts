import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { parseString, Builder } from 'xml2js';

function parseXml(content: string): Promise<any> {
  return new Promise((resolve, reject) => {
    parseString(content, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

const DEFAULT_JETBRAINS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<application>
  <component name="llm.mcpServers">
  </component>
</application>`;

export async function readXmlConfig(filePath: string): Promise<any> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return await parseXml(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return await parseXml(DEFAULT_JETBRAINS_XML);
    }
    throw err;
  }
}

export async function writeXmlConfig(filePath: string, data: any): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const builder = new Builder({ headless: false, renderOpts: { pretty: true, indent: '  ' } });
  const xml = builder.buildObject(data);
  await writeFile(filePath, xml + '\n', 'utf-8');
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

function findMcpComponent(data: any): any | null {
  const components = ensureArray(data?.application?.component);
  return components.find((c: any) => c?.$?.name === 'llm.mcpServers') ?? null;
}

export async function modifyJetBrainsConfig(
  filePath: string,
  serverName: string,
  command: string,
  args: string
): Promise<void> {
  const data = await readXmlConfig(filePath);

  if (!data.application) {
    data.application = {};
  }

  data.application.component = ensureArray(data.application.component);

  let mcpComponent = findMcpComponent(data);
  if (!mcpComponent) {
    mcpComponent = { $: { name: 'llm.mcpServers' } };
    data.application.component.push(mcpComponent);
  }

  mcpComponent.server = ensureArray(mcpComponent.server);

  const existingIndex = mcpComponent.server.findIndex(
    (s: any) => s?.$?.name === serverName
  );

  const serverEntry = {
    $: { name: serverName },
    command,
    args,
  };

  if (existingIndex >= 0) {
    mcpComponent.server[existingIndex] = serverEntry;
  } else {
    mcpComponent.server.push(serverEntry);
  }

  await writeXmlConfig(filePath, data);
}

export async function removeFromJetBrainsConfig(
  filePath: string,
  serverName: string
): Promise<void> {
  const data = await readXmlConfig(filePath);
  const mcpComponent = findMcpComponent(data);
  if (!mcpComponent) return;

  mcpComponent.server = ensureArray(mcpComponent.server).filter(
    (s: any) => s?.$?.name !== serverName
  );

  await writeXmlConfig(filePath, data);
}

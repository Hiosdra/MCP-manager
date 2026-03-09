import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import * as jsonc from 'jsonc-parser';

export async function readJsoncConfig(filePath: string): Promise<any> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return jsonc.parse(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

export async function modifyJsoncSection(
  filePath: string,
  path: (string | number)[],
  value: any
): Promise<void> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      text = '{}';
    } else {
      throw err;
    }
  }

  const edits = jsonc.modify(text, path, value, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  });
  const updated = jsonc.applyEdits(text, edits);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, updated, 'utf-8');
}

export async function removeFromJsoncSection(
  filePath: string,
  path: (string | number)[]
): Promise<void> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return;
    }
    throw err;
  }

  const edits = jsonc.modify(text, path, undefined, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  });
  const updated = jsonc.applyEdits(text, edits);

  await writeFile(filePath, updated, 'utf-8');
}

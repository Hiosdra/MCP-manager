import { describe, expect, it } from 'vitest';
import { getClientConfigPath } from '../src/main/utils/clientDetector';
import { ClientType } from '../src/shared/types';

describe('clientDetector', () => {
  it('returns the documented Gemini CLI config path for the current platform', () => {
    const configPath = getClientConfigPath(ClientType.GeminiCli);

    expect(configPath).not.toBeNull();
    if (process.platform === 'win32') {
      expect(configPath).toMatch(/\.gemini\\settings\.json$/);
    } else {
      expect(configPath).toMatch(/\/\.gemini\/settings\.json$/);
    }
  });

  it('returns the documented Junie config path for the current platform', () => {
    const configPath = getClientConfigPath(ClientType.Junie);

    expect(configPath).not.toBeNull();
    if (process.platform === 'win32') {
      expect(configPath).toMatch(/\.junie\\mcp\\mcp\.json$/);
    } else {
      expect(configPath).toMatch(/\/\.junie\/mcp\/mcp\.json$/);
    }
  });
});

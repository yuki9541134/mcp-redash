import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConfig, reloadConfig } from './config';

describe('getConfig', () => {
  beforeEach(() => {
    reloadConfig();
    vi.unstubAllEnvs();
  });

  it('環境変数から設定を読み込める', () => {
    vi.stubEnv('REDASH_API_KEY', 'my-key');
    vi.stubEnv('REDASH_BASE_URL', 'https://redash.example.com');

    const config = getConfig();
    expect(config.apiKey).toBe('my-key');
    expect(config.baseUrl).toBe('https://redash.example.com');
    expect(config.dataSourceId).toBeUndefined();
  });

  it('DATA_SOURCE_ID が設定されている場合、数値に変換する', () => {
    vi.stubEnv('REDASH_API_KEY', 'my-key');
    vi.stubEnv('REDASH_BASE_URL', 'https://redash.example.com');
    vi.stubEnv('DATA_SOURCE_ID', '42');

    const config = getConfig();
    expect(config.dataSourceId).toBe(42);
  });

  it('REDASH_API_KEY が未設定の場合はエラー', () => {
    vi.stubEnv('REDASH_API_KEY', '');
    vi.stubEnv('REDASH_BASE_URL', 'https://redash.example.com');

    // 空文字は falsy なのでエラーになる
    reloadConfig();
    expect(() => getConfig()).toThrow('REDASH_API_KEY');
  });

  it('REDASH_BASE_URL が未設定の場合はエラー', () => {
    vi.stubEnv('REDASH_API_KEY', 'my-key');
    vi.stubEnv('REDASH_BASE_URL', '');

    reloadConfig();
    expect(() => getConfig()).toThrow('REDASH_BASE_URL');
  });

  it('二回目の呼び出しはキャッシュから返す', () => {
    vi.stubEnv('REDASH_API_KEY', 'my-key');
    vi.stubEnv('REDASH_BASE_URL', 'https://redash.example.com');

    const config1 = getConfig();
    const config2 = getConfig();
    expect(config1).toBe(config2); // 同一参照
  });

  it('reloadConfig でキャッシュをクリアできる', () => {
    vi.stubEnv('REDASH_API_KEY', 'key-1');
    vi.stubEnv('REDASH_BASE_URL', 'https://redash.example.com');

    const config1 = getConfig();

    vi.stubEnv('REDASH_API_KEY', 'key-2');
    reloadConfig();

    const config2 = getConfig();
    expect(config2.apiKey).toBe('key-2');
    expect(config1).not.toBe(config2);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { encodeBase64, decodeBase64, createHeaders, handleResponse, sleep } from './utils';

// config モジュールのモック
vi.mock('../config.js', () => ({
  getConfig: () => ({
    apiKey: 'test-api-key',
    baseUrl: 'https://redash.example.com',
  }),
}));

describe('encodeBase64 / decodeBase64', () => {
  it('文字列をBase64にエンコード・デコードできる', () => {
    const original = 'Hello, World!';
    const encoded = encodeBase64(original);
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(decodeBase64(encoded)).toBe(original);
  });

  it('日本語もエンコード・デコードできる', () => {
    const original = 'こんにちは';
    const encoded = encodeBase64(original);
    expect(decodeBase64(encoded)).toBe(original);
  });

  it('空文字列を扱える', () => {
    expect(encodeBase64('')).toBe('');
    expect(decodeBase64('')).toBe('');
  });
});

describe('createHeaders', () => {
  it('Authorization と Content-Type ヘッダーを返す', () => {
    const headers = createHeaders();
    expect(headers).toEqual({
      Authorization: 'Key test-api-key',
      'Content-Type': 'application/json',
    });
  });
});

describe('handleResponse', () => {
  function createMockResponse(status: number, body: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: `Status ${status}`,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response;
  }

  it('200 の場合、JSONボディを返す', async () => {
    const res = createMockResponse(200, { data: 'ok' });
    const result = await handleResponse<{ data: string }>(res as any);
    expect(result).toEqual({ data: 'ok' });
  });

  it('401 の場合、RedashAuthenticationError をスロー', async () => {
    const res = createMockResponse(401, {});
    await expect(handleResponse(res as any)).rejects.toThrow('Invalid API key');
  });

  it('404 の場合、RedashResourceNotFoundError をスロー', async () => {
    const res = createMockResponse(404, {});
    await expect(handleResponse(res as any)).rejects.toThrow('Resource not found');
  });

  it('400 の場合、RedashValidationError をスロー', async () => {
    const res = createMockResponse(400, {});
    await expect(handleResponse(res as any)).rejects.toThrow('Invalid request parameters');
  });

  it('429 の場合、RedashRateLimitError をスロー', async () => {
    const res = createMockResponse(429, {});
    await expect(handleResponse(res as any)).rejects.toThrow('API rate limit exceeded');
  });

  it('500 の場合、RedashServerError をスロー', async () => {
    const res = createMockResponse(500, {});
    await expect(handleResponse(res as any)).rejects.toThrow('Redash server error');
  });
});

describe('sleep', () => {
  it('指定ミリ秒後に resolve する', async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await promise;
    vi.useRealTimers();
  });
});

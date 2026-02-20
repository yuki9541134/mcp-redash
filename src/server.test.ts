import { describe, it, expect, vi } from 'vitest';
import { createServer, formatRedashError } from './server';
import { RedashError } from './common/errors';

// 外部依存のモック
vi.mock('./operations/queries.js', () => ({
  ExecuteQuerySchema: { parse: vi.fn() },
  executeQueryAndWait: vi.fn(),
}));

vi.mock('./operations/datasources.js', () => ({
  DataSourceSchema: { parse: vi.fn() },
  listDataSources: vi.fn(),
  getDataSource: vi.fn(),
}));

vi.mock('./operations/saved-queries.js', () => ({
  GetQuerySchema: { parse: vi.fn() },
  SearchQueriesSchema: { parse: vi.fn() },
  GetQueryResultSchema: { parse: vi.fn() },
  GetSavedQueryResultSchema: { parse: vi.fn() },
  getQuery: vi.fn(),
  searchQueries: vi.fn(),
  getQueryResultById: vi.fn(),
  getSavedQueryResult: vi.fn(),
}));

vi.mock('./common/errors.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./common/errors')>();
  return actual;
});

describe('createServer', () => {
  it('Serverインスタンスを返す', () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it('複数回呼び出しても独立したインスタンスを返す', () => {
    const server1 = createServer();
    const server2 = createServer();
    expect(server1).not.toBe(server2);
  });
});

describe('formatRedashError', () => {
  it('基本的なエラーメッセージを整形する', () => {
    const error = new RedashError('Connection failed');
    const result = formatRedashError(error);
    expect(result).toBe('Redash API Error: Connection failed');
  });

  it('ステータスコード付きのエラーを整形する', () => {
    const error = new RedashError('Not found', 404);
    const result = formatRedashError(error);
    expect(result).toContain('Status: 404');
  });

  it('JSON形式のresponseBodyからdetailsを抽出する', () => {
    const error = new RedashError('Error', 500, '{"message":"DB connection failed"}');
    const result = formatRedashError(error);
    expect(result).toContain('Details: DB connection failed');
  });

  it('非JSON形式のresponseBodyをそのまま表示する', () => {
    const error = new RedashError('Error', 500, 'plain text error');
    const result = formatRedashError(error);
    expect(result).toContain('Details: plain text error');
  });
});

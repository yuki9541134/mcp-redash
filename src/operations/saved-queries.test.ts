import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getQuery,
  searchQueries,
  getQueryResultById,
  getSavedQueryResult,
} from './saved-queries';

vi.mock('../common/utils.js', () => ({
  apiGet: vi.fn(),
}));

vi.mock('../config.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    apiKey: 'test-key',
    baseUrl: 'https://redash.example.com',
    dataSourceId: 1,
  }),
}));

import { apiGet } from '../common/utils';

const mockApiGet = vi.mocked(apiGet);

describe('getQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('保存済みクエリの詳細を取得できる', async () => {
    const mockQuery = {
      id: 1,
      name: 'Test Query',
      description: 'A test query',
      query: 'SELECT * FROM users',
      query_hash: 'abc123',
      data_source_id: 1,
      is_archived: false,
      is_draft: false,
      is_safe: true,
      schedule: null,
      tags: ['test'],
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
      latest_query_data_id: 100,
      user: { id: 1, name: 'Admin', email: 'admin@example.com' },
      options: {},
    };
    mockApiGet.mockResolvedValue(mockQuery);

    const result = await getQuery(1);
    expect(result).toEqual(mockQuery);
    expect(mockApiGet).toHaveBeenCalledWith('/api/queries/1');
  });
});

describe('searchQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('キーワードでクエリを検索できる', async () => {
    const mockResponse = {
      count: 1,
      page: 1,
      page_size: 25,
      results: [
        {
          id: 1,
          name: 'User Query',
          description: '',
          query: 'SELECT * FROM users',
          query_hash: 'abc',
          data_source_id: 1,
          is_archived: false,
          is_draft: false,
          is_safe: true,
          schedule: null,
          tags: [],
          created_at: '2026-01-01',
          updated_at: '2026-01-02',
          latest_query_data_id: null,
          user: { id: 1, name: 'Admin', email: 'admin@example.com' },
          options: {},
        },
      ],
    };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await searchQueries({ q: 'users' });
    expect(result).toEqual(mockResponse);
    expect(mockApiGet).toHaveBeenCalledWith('/api/queries?q=users');
  });

  it('ページネーションパラメータを指定できる', async () => {
    mockApiGet.mockResolvedValue({ count: 0, page: 2, page_size: 10, results: [] });

    await searchQueries({ q: 'test', page: 2, page_size: 10 });
    expect(mockApiGet).toHaveBeenCalledWith('/api/queries?q=test&page=2&page_size=10');
  });
});

describe('getQueryResultById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('クエリ結果をIDで取得できる', async () => {
    const mockResult = {
      id: 100,
      query_hash: 'abc',
      query: 'SELECT 1',
      data: { columns: [], rows: [] },
      data_source_id: 1,
      runtime: 0.5,
      retrieved_at: '2026-01-01',
    };
    mockApiGet.mockResolvedValue({ query_result: mockResult });

    const result = await getQueryResultById(100);
    expect(result).toEqual(mockResult);
    expect(mockApiGet).toHaveBeenCalledWith('/api/query_results/100.json');
  });
});

describe('getSavedQueryResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('保存済みクエリの最新結果を取得できる', async () => {
    const mockResult = {
      id: 200,
      query_hash: 'def',
      query: 'SELECT * FROM orders',
      data: { columns: [{ name: 'id', type: 'integer', friendly_name: 'id' }], rows: [{ id: 1 }] },
      data_source_id: 1,
      runtime: 1.2,
      retrieved_at: '2026-01-01',
    };
    mockApiGet.mockResolvedValue({ query_result: mockResult });

    const result = await getSavedQueryResult(5);
    expect(result).toEqual(mockResult);
    expect(mockApiGet).toHaveBeenCalledWith('/api/queries/5/results.json');
  });
});

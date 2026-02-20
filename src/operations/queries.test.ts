import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeQuery, getQueryResult, executeQueryAndWait } from './queries';

vi.mock('../common/utils.js', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    apiKey: 'test-key',
    baseUrl: 'https://redash.example.com',
    dataSourceId: 1,
  }),
}));

vi.mock('./jobs.js', () => ({
  waitForJob: vi.fn(),
}));

import { apiPost, apiGet } from '../common/utils';
import { waitForJob } from './jobs';
import { getConfig } from '../config';

const mockApiPost = vi.mocked(apiPost);
const mockApiGet = vi.mocked(apiGet);
const mockWaitForJob = vi.mocked(waitForJob);
const mockGetConfig = vi.mocked(getConfig);

describe('executeQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockReturnValue({
      apiKey: 'test-key',
      baseUrl: 'https://redash.example.com',
      dataSourceId: 1,
    });
  });

  it('パラメータ付きでクエリを実行しジョブIDを返す', async () => {
    mockApiPost.mockResolvedValue({ job: { id: 'job-123' } });

    const result = await executeQuery({ query: 'SELECT 1', data_source_id: 2 });
    expect(result).toBe('job-123');
    expect(mockApiPost).toHaveBeenCalledWith('/api/query_results', {
      data_source_id: 2,
      query: 'SELECT 1',
      max_age: 0,
    });
  });

  it('data_source_id 未指定の場合はデフォルト値を使用する', async () => {
    mockApiPost.mockResolvedValue({ job: { id: 'job-456' } });

    await executeQuery({ query: 'SELECT 1' });
    expect(mockApiPost).toHaveBeenCalledWith('/api/query_results', {
      data_source_id: 1,
      query: 'SELECT 1',
      max_age: 0,
    });
  });

  it('data_source_id もデフォルトもない場合はエラー', async () => {
    mockGetConfig.mockReturnValue({
      apiKey: 'test-key',
      baseUrl: 'https://redash.example.com',
      dataSourceId: undefined,
    });

    await expect(executeQuery({ query: 'SELECT 1' })).rejects.toThrow('data_source_id is required');
  });
});

describe('getQueryResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('クエリ結果を取得できる', async () => {
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

    const result = await getQueryResult(100);
    expect(result).toEqual(mockResult);
    expect(mockApiGet).toHaveBeenCalledWith('/api/query_results/100.json');
  });
});

describe('executeQueryAndWait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockReturnValue({
      apiKey: 'test-key',
      baseUrl: 'https://redash.example.com',
      dataSourceId: 1,
    });
  });

  it('正常完了時にクエリ結果を返す', async () => {
    mockApiPost.mockResolvedValue({ job: { id: 'job-1' } });
    mockWaitForJob.mockResolvedValue({
      job: { id: 'job-1', status: 3, query_result_id: 200 },
    });
    const mockResult = {
      id: 200,
      query_hash: 'abc',
      query: 'SELECT 1',
      data: { columns: [], rows: [{ a: 1 }] },
      data_source_id: 1,
      runtime: 0.5,
      retrieved_at: '2026-01-01',
    };
    mockApiGet.mockResolvedValue({ query_result: mockResult });

    const result = await executeQueryAndWait({ query: 'SELECT 1' });
    expect(result).toEqual(mockResult);
  });

  it('ジョブ失敗(status=4)時にエラーをスロー', async () => {
    mockApiPost.mockResolvedValue({ job: { id: 'job-1' } });
    mockWaitForJob.mockResolvedValue({
      job: { id: 'job-1', status: 4, error: 'SQL syntax error' },
    });

    await expect(executeQueryAndWait({ query: 'INVALID SQL' })).rejects.toThrow(
      'Query execution failed: SQL syntax error'
    );
  });

  it('query_result_id がない場合にエラーをスロー', async () => {
    mockApiPost.mockResolvedValue({ job: { id: 'job-1' } });
    mockWaitForJob.mockResolvedValue({
      job: { id: 'job-1', status: 3 },
    });

    await expect(executeQueryAndWait({ query: 'SELECT 1' })).rejects.toThrow(
      'Query completed but no result was returned'
    );
  });
});

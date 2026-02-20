import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listDataSources, getDataSource } from './datasources';

vi.mock('../common/utils.js', () => ({
  apiGet: vi.fn(),
}));

vi.mock('../config.js', () => ({
  getConfig: () => ({
    apiKey: 'test-key',
    baseUrl: 'https://redash.example.com',
  }),
}));

import { apiGet } from '../common/utils';

const mockApiGet = vi.mocked(apiGet);

describe('listDataSources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('データソース一覧を取得できる', async () => {
    const mockSources = [
      { id: 1, name: 'PostgreSQL', type: 'pg', syntax: 'sql', paused: false, pause_reason: null, supports_auto_limit: true, view_only: false },
      { id: 2, name: 'MySQL', type: 'mysql', syntax: 'sql', paused: false, pause_reason: null, supports_auto_limit: true, view_only: false },
    ];
    mockApiGet.mockResolvedValue(mockSources);

    const result = await listDataSources();
    expect(result).toEqual(mockSources);
    expect(mockApiGet).toHaveBeenCalledWith('/api/data_sources');
  });

  it('空の一覧を返せる', async () => {
    mockApiGet.mockResolvedValue([]);

    const result = await listDataSources();
    expect(result).toEqual([]);
  });
});

describe('getDataSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('特定のデータソースを取得できる', async () => {
    const mockSource = {
      id: 1,
      name: 'PostgreSQL',
      type: 'pg',
      syntax: 'sql',
      paused: false,
      pause_reason: null,
      supports_auto_limit: true,
      view_only: false,
    };
    mockApiGet.mockResolvedValue(mockSource);

    const result = await getDataSource(1);
    expect(result).toEqual(mockSource);
    expect(mockApiGet).toHaveBeenCalledWith('/api/data_sources/1');
  });
});

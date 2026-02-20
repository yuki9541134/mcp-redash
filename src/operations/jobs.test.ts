import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJobStatus, waitForJob } from './jobs';

// utils モジュールのモック
vi.mock('../common/utils.js', () => ({
  apiGet: vi.fn(),
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config.js', () => ({
  getConfig: () => ({
    apiKey: 'test-key',
    baseUrl: 'https://redash.example.com',
  }),
}));

import { apiGet, sleep } from '../common/utils';

const mockApiGet = vi.mocked(apiGet);
const mockSleep = vi.mocked(sleep);

describe('getJobStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ジョブステータスを取得できる', async () => {
    const jobResponse = { job: { id: 'job-1', status: 1 } };
    mockApiGet.mockResolvedValue(jobResponse);

    const result = await getJobStatus('job-1');
    expect(result).toEqual(jobResponse);
    expect(mockApiGet).toHaveBeenCalledWith('/api/jobs/job-1');
  });
});

describe('waitForJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ジョブ完了(status=3)で結果を返す', async () => {
    const completedJob = { job: { id: 'job-1', status: 3, query_result_id: 100 } };
    mockApiGet.mockResolvedValue(completedJob);

    const result = await waitForJob('job-1', 5000, 100);
    expect(result).toEqual(completedJob);
  });

  it('ジョブ失敗(status=4)で結果を返す', async () => {
    const failedJob = { job: { id: 'job-1', status: 4, error: 'SQL error' } };
    mockApiGet.mockResolvedValue(failedJob);

    const result = await waitForJob('job-1', 5000, 100);
    expect(result).toEqual(failedJob);
  });

  it('ポーリング中にステータスが変わるケース', async () => {
    const pending = { job: { id: 'job-1', status: 1 } };
    const processing = { job: { id: 'job-1', status: 2 } };
    const completed = { job: { id: 'job-1', status: 3, query_result_id: 100 } };

    mockApiGet
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(processing)
      .mockResolvedValueOnce(completed);

    const result = await waitForJob('job-1', 10000, 100);
    expect(result).toEqual(completed);
    expect(mockApiGet).toHaveBeenCalledTimes(3);
    expect(mockSleep).toHaveBeenCalledTimes(2);
  });

  it('タイムアウトでエラーをスロー', async () => {
    const pending = { job: { id: 'job-1', status: 1 } };
    mockApiGet.mockResolvedValue(pending);

    // sleepが呼ばれるたびに時間を進める
    let elapsed = 0;
    const realDateNow = Date.now;
    const startTime = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => {
      return startTime + elapsed;
    });
    mockSleep.mockImplementation(async () => {
      elapsed += 200;
    });

    await expect(waitForJob('job-1', 500, 200)).rejects.toThrow('timed out');

    vi.spyOn(Date, 'now').mockRestore();
  });
});

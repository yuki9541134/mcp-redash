/**
 * Redashのジョブ操作関連の機能
 */

import { z } from 'zod';
import { apiGet, sleep } from '../common/utils.js';
import { Job, JobStatus } from '../common/types.js';
import { RedashResourceNotFoundError } from '../common/errors.js';

/**
 * ジョブステータス取得パラメータのスキーマ
 */
export const JobStatusSchema = z.object({
  job_id: z.string()
});

/**
 * ジョブのステータスを取得する
 */
export async function getJobStatus(jobId: string): Promise<Job> {
  try {
    const response = await apiGet<Job>(`/api/jobs/${jobId}`);
    return response;
  } catch (error) {
    if (error instanceof RedashResourceNotFoundError) {
      throw new Error(`Job with ID ${jobId} not found. It may have expired or been deleted.`);
    }
    throw error;
  }
}

/**
 * ジョブが完了するまで待機する
 * @param jobId ジョブID
 * @param timeout タイムアウト時間（ミリ秒）
 * @param interval チェック間隔（ミリ秒）
 */
export async function waitForJob(
  jobId: string, 
  timeout: number = 60000, 
  interval: number = 1000
): Promise<Job> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const job = await getJobStatus(jobId);
    
    if (job.status === 'finished' || job.status === 'failed') {
      return job;
    }
    
    await sleep(interval);
  }
  
  throw new Error(`Job execution timed out after ${timeout}ms`);
} 
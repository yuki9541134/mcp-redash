/**
 * Redashのジョブ操作関連の機能
 */

import { z } from 'zod';
import { apiGet, sleep } from '../common/utils.js';
import { Job, JobResponse } from '../common/types.js';
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
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  try {
    const response = await apiGet<JobResponse>(`/api/jobs/${jobId}`);
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
  timeout: number = 300000, 
  interval: number = 1000
): Promise<JobResponse> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const response = await getJobStatus(jobId);
    
    // responseがjobプロパティを持つオブジェクトの場合
    const job = response.job || response as unknown as Job;

    if (job.status === 3 || job.status === 4 || job.status === 5) {
      return response;
    }
    
    await sleep(interval);
  }
  
  throw new Error(`Job execution timed out after ${timeout}ms`);
}

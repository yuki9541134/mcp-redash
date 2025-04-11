/**
 * Redashのクエリ操作関連の機能
 */

import { z } from 'zod';
import { apiPost, apiGet } from '../common/utils.js';
import { getConfig } from '../config.js';
import { QueryParams, QueryResult, Job } from '../common/types.js';
import { RedashValidationError, RedashError } from '../common/errors.js';
import { getJobStatus, waitForJob } from './jobs.js';

/**
 * クエリ実行パラメータのスキーマ
 */
export const ExecuteQuerySchema = z.object({
  data_source_id: z.number().optional(),
  query: z.string(),
  max_age: z.number().optional()
});

/**
 * クエリ結果取得パラメータのスキーマ
 */
export const QueryResultSchema = z.object({
  query_result_id: z.number()
});

/**
 * クエリを実行する
 */
export async function executeQuery(params: z.infer<typeof ExecuteQuerySchema>): Promise<string> {
  const { dataSourceId } = getConfig();
  
  // データソースIDが指定されていなければデフォルト値を使用
  const data_source_id = params.data_source_id || dataSourceId;
  
  if (!data_source_id) {
    throw new RedashValidationError('data_source_id is required either in params or as DEFAULT_DATA_SOURCE_ID environment variable');
  }
  
  const queryParams: QueryParams = {
    data_source_id,
    query: params.query,
    max_age: 0
  };
  
  const response = await apiPost<{ job: { id: string } }>('/api/query_results', queryParams);
  return response.job.id;
}

/**
 * クエリ結果を取得する
 */
export async function getQueryResult(queryResultId: number): Promise<QueryResult> {
  const response = await apiGet<{ query_result: QueryResult }>(`/api/query_results/${queryResultId}.json`);
  return response.query_result;
}

/**
 * クエリを実行し、結果が利用可能になるまで待機する
 */
export async function executeQueryAndWait(
  params: z.infer<typeof ExecuteQuerySchema>,
  timeout: number = 60000,
  interval: number = 1000
): Promise<QueryResult> {
  const jobId = await executeQuery(params);
  const job = await waitForJob(jobId, timeout, interval);
  
  if (job.status === 4) {
    throw new RedashError(`Query execution failed: ${job.error || 'Unknown error'}`);
  }
  
  if (!job.query_result_id) {
    throw new RedashError('Query completed but no result was returned');
  }
  
  return getQueryResult(job.query_result_id);
}

/**
 * Redashのクエリ操作関連の機能
 */

import { z } from 'zod';
import { apiPost, apiGet } from '../common/utils.js';
import { getConfig } from '../config.js';
import { QueryParams, QueryResult, Job } from '../common/types.js';
import { RedashValidationError } from '../common/errors.js';
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
    max_age: params.max_age
  };
  
  const response = await apiPost<{ query_result: { id: number } }>('/api/query_results', queryParams);
  return String(response.query_result.id);
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
  const queryResultId = await executeQuery(params);
  // query_resultが直接返される場合は、waitForJobは不要
  return getQueryResult(parseInt(queryResultId, 10));
} 
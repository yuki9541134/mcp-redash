/**
 * Redashの保存済みクエリ操作関連の機能
 */

import { z } from 'zod';
import { apiGet } from '../common/utils.js';
import { SavedQuery, SavedQueryListResponse, QueryResult } from '../common/types.js';

/**
 * 保存済みクエリ取得パラメータのスキーマ
 */
export const GetQuerySchema = z.object({
  query_id: z.number(),
});

/**
 * クエリ検索パラメータのスキーマ
 */
export const SearchQueriesSchema = z.object({
  q: z.string(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

/**
 * クエリ結果ID指定取得パラメータのスキーマ
 */
export const GetQueryResultSchema = z.object({
  query_result_id: z.number(),
});

/**
 * 保存済みクエリの最新結果取得パラメータのスキーマ
 */
export const GetSavedQueryResultSchema = z.object({
  query_id: z.number(),
});

/**
 * 保存済みクエリの詳細を取得する
 */
export async function getQuery(queryId: number): Promise<SavedQuery> {
  return apiGet<SavedQuery>(`/api/queries/${queryId}`);
}

/**
 * クエリをキーワード検索する
 */
export async function searchQueries(
  params: z.infer<typeof SearchQueriesSchema>
): Promise<SavedQueryListResponse> {
  const searchParams = new URLSearchParams({ q: params.q });
  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params.page_size !== undefined) {
    searchParams.set('page_size', String(params.page_size));
  }
  return apiGet<SavedQueryListResponse>(`/api/queries?${searchParams.toString()}`);
}

/**
 * クエリ結果をIDで取得する（再実行なし）
 */
export async function getQueryResultById(queryResultId: number): Promise<QueryResult> {
  const response = await apiGet<{ query_result: QueryResult }>(
    `/api/query_results/${queryResultId}.json`
  );
  return response.query_result;
}

/**
 * 保存済みクエリの最新キャッシュ結果を取得する
 */
export async function getSavedQueryResult(queryId: number): Promise<QueryResult> {
  const response = await apiGet<{ query_result: QueryResult }>(
    `/api/queries/${queryId}/results.json`
  );
  return response.query_result;
}

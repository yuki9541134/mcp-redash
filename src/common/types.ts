/**
 * Redash APIの共通型定義
 */

/**
 * クエリパラメータの型
 */
export interface QueryParams {
  data_source_id: number;
  query: string;
  max_age?: number;
}

/**
 * クエリ結果の型
 */
export interface QueryResult {
  id: number;
  query_hash: string;
  query: string;
  data: {
    columns: Array<{
      name: string;
      type: string;
      friendly_name: string;
    }>;
    rows: Array<Record<string, unknown>>;
  };
  data_source_id: number;
  runtime: number;
  retrieved_at: string;
}

/**
 * ジョブステータスの型
 */
export type JobStatus = 'pending' | 'processing' | 'finished' | 'failed';

/**
 * ジョブの型
 */
export interface Job {
  id: string;
  status: number;
  error?: string;
  query_result_id?: number;
  updated_at?: number;
  result?: unknown;
}

/**
 * ジョブレスポンスの型（入れ子になっている場合）
 */
export interface JobResponse {
  job?: Job;
  [key: string]: unknown;
}

/**
 * データソースの型
 */
export interface DataSource {
  id: number;
  name: string;
  type: string;
  syntax: string;
  paused: boolean;
  pause_reason: string | null;
  supports_auto_limit: boolean;
  view_only: boolean;
}

/**
 * 保存済みクエリの型
 */
export interface SavedQuery {
  id: number;
  name: string;
  description: string | null;
  query: string;
  query_hash: string;
  data_source_id: number | null;
  is_archived: boolean;
  is_draft: boolean;
  is_safe: boolean;
  schedule: Record<string, unknown> | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  latest_query_data_id: number | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  options: Record<string, unknown>;
}

/**
 * 保存済みクエリ一覧のページングレスポンス型
 */
export interface SavedQueryListResponse {
  count: number;
  page: number;
  page_size: number;
  results: SavedQuery[];
}

/**
 * APIレスポンスの共通型
 */
export interface ApiResponse<T> {
  status: number;
  data: T;
}

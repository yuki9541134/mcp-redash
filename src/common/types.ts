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
    rows: Array<Record<string, any>>;
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
  result?: any;
}

/**
 * ジョブレスポンスの型（入れ子になっている場合）
 */
export interface JobResponse {
  job?: Job;
  [key: string]: any;
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
 * APIレスポンスの共通型
 */
export interface ApiResponse<T> {
  status: number;
  data: T;
} 

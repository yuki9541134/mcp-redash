/**
 * Redashのデータソース操作関連の機能
 */

import { z } from 'zod';
import { apiGet } from '../common/utils.js';
import { DataSource } from '../common/types.js';

/**
 * データソース取得パラメータのスキーマ
 */
export const DataSourceSchema = z.object({
  data_source_id: z.number()
});

/**
 * データソースの一覧を取得する
 */
export async function listDataSources(): Promise<DataSource[]> {
  return await apiGet<DataSource[]>('/api/data_sources');
}

/**
 * 特定のデータソースの詳細を取得する
 */
export async function getDataSource(dataSourceId: number): Promise<DataSource> {
  return await apiGet<DataSource>(`/api/data_sources/${dataSourceId}`);
} 
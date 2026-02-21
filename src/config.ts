/**
 * Redash MCP Serverの設定ファイル
 * 環境変数から設定を読み込みます
 */

export interface Config {
  apiKey: string;
  baseUrl: string;
  dataSourceId?: number;
}

export const PORT = Number(process.env.PORT) || 3000;

let config: Config | null = null;

/**
 * 設定を取得する
 * 初回呼び出し時に環境変数から設定を読み込み、キャッシュします
 */
export function getConfig(): Config {
  if (!config) {
    const apiKey = process.env.REDASH_API_KEY;
    const baseUrl = process.env.REDASH_BASE_URL;
    const dataSourceId = process.env.DATA_SOURCE_ID ? parseInt(process.env.DATA_SOURCE_ID, 10) : undefined;
    
    if (!apiKey) {
      throw new Error('REDASH_API_KEY environment variable is required');
    }
    
    if (!baseUrl) {
      throw new Error('REDASH_BASE_URL environment variable is required');
    }
    
    config = { apiKey, baseUrl, dataSourceId };
  }
  
  return config;
}

/**
 * 設定を再読み込みする
 * テスト時などに使用
 */
export function reloadConfig(): void {
  config = null;
} 

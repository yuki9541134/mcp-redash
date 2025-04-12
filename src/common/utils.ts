/**
 * Redash API操作用の共通ユーティリティ関数
 */

import fetch, { Response } from 'node-fetch';
import { getConfig } from '../config.js';
import {
  RedashError,
  RedashAuthenticationError,
  RedashResourceNotFoundError,
  RedashValidationError,
  RedashServerError,
  RedashRateLimitError
} from './errors.js';
import { ApiResponse } from './types.js';

/**
 * コンテンツをBase64エンコードする
 */
export function encodeBase64(content: string): string {
  return Buffer.from(content).toString('base64');
}

/**
 * Base64コンテンツをデコードする
 */
export function decodeBase64(content: string): string {
  return Buffer.from(content, 'base64').toString('utf-8');
}

/**
 * Redash APIリクエスト用のヘッダーを作成する
 */
export function createHeaders(): Record<string, string> {
  const { apiKey } = getConfig();
  return {
    'Authorization': `Key ${apiKey}`,
    'Content-Type': 'application/json'
  };
}

/**
 * APIレスポンスを処理する共通関数
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    const data = await response.json();
    return data as T;
  }
  
  const text = await response.text();
  
  switch (response.status) {
    case 401:
      throw new RedashAuthenticationError('Invalid API key or unauthorized access');
    case 404:
      throw new RedashResourceNotFoundError('Resource not found');
    case 400:
      throw new RedashValidationError('Invalid request parameters');
    case 429:
      throw new RedashRateLimitError('API rate limit exceeded');
    case 500:
      throw new RedashServerError('Redash server error');
    default:
      throw new RedashError(`API request failed: ${response.statusText}`, 
                          response.status, text);
  }
}

/**
 * Redash APIに対してGETリクエストを送信する
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const { baseUrl } = getConfig();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders()
  });
  
  return handleResponse<T>(response);
}

/**
 * Redash APIに対してPOSTリクエストを送信する
 */
export async function apiPost<T, U = any>(endpoint: string, data: U): Promise<T> {
  const { baseUrl } = getConfig();
  const url = `${baseUrl}${endpoint}`;
    
  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(data)
  });

  return handleResponse<T>(response);
}

/**
 * 指定時間待機する
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 

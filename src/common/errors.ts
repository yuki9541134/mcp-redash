/**
 * Redash APIのエラーハンドリングクラス
 */

/**
 * RedashのAPI呼び出しで発生する基本的なエラークラス
 */
export class RedashError extends Error {
  statusCode?: number;
  responseBody?: string;
  
  constructor(message: string, statusCode?: number, responseBody?: string) {
    super(message);
    this.name = 'RedashError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * 認証エラー (401)
 */
export class RedashAuthenticationError extends RedashError {
  constructor(message: string = 'Authentication failed. Invalid API key.') {
    super(message, 401);
    this.name = 'RedashAuthenticationError';
  }
}

/**
 * リソース未検出エラー (404)
 */
export class RedashResourceNotFoundError extends RedashError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'RedashResourceNotFoundError';
  }
}

/**
 * バリデーションエラー (400)
 */
export class RedashValidationError extends RedashError {
  constructor(message: string = 'Invalid input parameters') {
    super(message, 400);
    this.name = 'RedashValidationError';
  }
}

/**
 * サーバーエラー (500)
 */
export class RedashServerError extends RedashError {
  constructor(message: string = 'Redash server error') {
    super(message, 500);
    this.name = 'RedashServerError';
  }
}

/**
 * APIレート制限エラー (429)
 */
export class RedashRateLimitError extends RedashError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RedashRateLimitError';
  }
}

/**
 * 与えられたエラーがRedashErrorかどうかをチェックする型ガード
 */
export function isRedashError(error: unknown): error is RedashError {
  return error instanceof RedashError;
} 

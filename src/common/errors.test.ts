import { describe, it, expect } from 'vitest';
import {
  RedashError,
  RedashAuthenticationError,
  RedashResourceNotFoundError,
  RedashValidationError,
  RedashServerError,
  RedashRateLimitError,
  isRedashError,
} from './errors';

describe('RedashError', () => {
  it('基本プロパティが正しく設定される', () => {
    const error = new RedashError('test error', 500, '{"detail":"fail"}');
    expect(error.message).toBe('test error');
    expect(error.statusCode).toBe(500);
    expect(error.responseBody).toBe('{"detail":"fail"}');
    expect(error.name).toBe('RedashError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('サブクラスのエラー', () => {
  it('RedashAuthenticationError はステータス401', () => {
    const error = new RedashAuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('RedashAuthenticationError');
    expect(error).toBeInstanceOf(RedashError);
  });

  it('RedashResourceNotFoundError はステータス404', () => {
    const error = new RedashResourceNotFoundError();
    expect(error.statusCode).toBe(404);
  });

  it('RedashValidationError はステータス400', () => {
    const error = new RedashValidationError();
    expect(error.statusCode).toBe(400);
  });

  it('RedashServerError はステータス500', () => {
    const error = new RedashServerError();
    expect(error.statusCode).toBe(500);
  });

  it('RedashRateLimitError はステータス429', () => {
    const error = new RedashRateLimitError();
    expect(error.statusCode).toBe(429);
  });
});

describe('isRedashError', () => {
  it('RedashError のインスタンスを正しく判別する', () => {
    expect(isRedashError(new RedashError('err'))).toBe(true);
    expect(isRedashError(new RedashAuthenticationError())).toBe(true);
    expect(isRedashError(new RedashResourceNotFoundError())).toBe(true);
    expect(isRedashError(new RedashValidationError())).toBe(true);
    expect(isRedashError(new RedashServerError())).toBe(true);
    expect(isRedashError(new RedashRateLimitError())).toBe(true);
  });

  it('通常の Error は false を返す', () => {
    expect(isRedashError(new Error('not redash'))).toBe(false);
  });

  it('非 Error オブジェクトは false を返す', () => {
    expect(isRedashError('string error')).toBe(false);
    expect(isRedashError(null)).toBe(false);
    expect(isRedashError(undefined)).toBe(false);
  });
});

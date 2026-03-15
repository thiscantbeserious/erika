// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateHeader } from './upload_service.js';

describe('validateHeader', () => {
  it('returns ok:true for valid v3 asciicast header', () => {
    const content = '{"version":3,"width":80,"height":24}\n[0,"o","hello"]';
    expect(validateHeader(content)).toEqual({ ok: true });
  });

  it('returns 400 when first line is not valid JSON', () => {
    const content = 'not json at all\n[0,"o","hello"]';
    const result = validateHeader(content);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(400);
      expect(result.error.error).toContain('JSON');
    }
  });

  it('returns 400 when first line is a JSON array', () => {
    const content = '[1,2,3]\n[0,"o","hello"]';
    const result = validateHeader(content);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(400);
      expect(result.error.error).toContain('object');
    }
  });

  it('returns 400 when first line is a JSON string', () => {
    const content = '"just a string"\n[0,"o","hello"]';
    const result = validateHeader(content);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(400);
      expect(result.error.error).toContain('object');
    }
  });

  it('returns 400 when first line is JSON null', () => {
    const content = 'null\n[0,"o","hello"]';
    const result = validateHeader(content);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(400);
    }
  });

  it('returns 422 when header fails Typia validation (version 2)', () => {
    const content = '{"version":2,"width":80,"height":24}\n[0,"o","hello"]';
    const result = validateHeader(content);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(422);
      expect(result.error.error).toContain('validation');
    }
  });

  it('returns 422 when header fails Typia validation (width 0)', () => {
    const content = '{"version":3,"width":0,"height":24}\n[0,"o","hello"]';
    const result = validateHeader(content);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(422);
    }
  });

  it('returns ok:true for empty lines before header', () => {
    const content = '\n\n{"version":3,"width":80,"height":24}\n[0,"o","hello"]';
    expect(validateHeader(content)).toEqual({ ok: true });
  });
});

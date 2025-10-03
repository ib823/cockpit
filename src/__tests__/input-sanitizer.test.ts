// src/__tests__/input-sanitizer.test.ts
import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeNumber,
  sanitizeChipValue,
  validateRfpText
} from '@/lib/input-sanitizer';

describe('Input Sanitizer', () => {
  describe('sanitizeHtml', () => {
    it('removes script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toBe('Hello');
    });

    it('removes event handlers', () => {
      const input = '<div onclick="alert(1)">Test</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('removes javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('removes iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe');
    });

    it('preserves safe text', () => {
      const input = 'This is a valid RFP text with 500 employees';
      const result = sanitizeHtml(input);
      expect(result).toBe(input);
    });
  });

  describe('sanitizeNumber', () => {
    it('returns 0 for negative numbers', () => {
      expect(sanitizeNumber(-100)).toBe(0);
      expect(sanitizeNumber('-500')).toBe(0);
    });

    it('returns 0 for NaN', () => {
      expect(sanitizeNumber(NaN)).toBe(0);
      expect(sanitizeNumber('abc')).toBe(0);
    });

    it('returns 0 for Infinity', () => {
      expect(sanitizeNumber(Infinity)).toBe(0);
      expect(sanitizeNumber(-Infinity)).toBe(0);
    });

    it('caps at MAX_SAFE_INTEGER', () => {
      const huge = Number.MAX_SAFE_INTEGER + 1000;
      expect(sanitizeNumber(huge)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('preserves valid positive numbers', () => {
      expect(sanitizeNumber(500)).toBe(500);
      expect(sanitizeNumber('1000')).toBe(1000);
      expect(sanitizeNumber('42.5')).toBe(42.5);
    });
  });

  describe('sanitizeChipValue', () => {
    it('sanitizes HTML in all chip types', () => {
      const result = sanitizeChipValue('<script>alert(1)</script>Malaysia', 'country');
      expect(result).not.toContain('<script>');
      expect(result).toBe('Malaysia');
    });

    it('validates numeric chips', () => {
      const result = sanitizeChipValue('-500', 'employees');
      expect(result).toBe('0');
    });

    it('limits timeline length', () => {
      const longText = 'a'.repeat(200);
      const result = sanitizeChipValue(longText, 'timeline');
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('limits general chip length', () => {
      const longText = 'b'.repeat(300);
      const result = sanitizeChipValue(longText, 'company');
      expect(result.length).toBeLessThanOrEqual(200);
    });
  });

  describe('validateRfpText', () => {
    it('accepts valid RFP text', () => {
      const text = 'This is a valid RFP for 500 employees in Malaysia';
      const result = validateRfpText(text);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe(text);
    });

    it('rejects empty text', () => {
      const result = validateRfpText('');
      expect(result.valid).toBe(false);
    });

    it('sanitizes malicious text', () => {
      const text = '<script>alert(1)</script>Valid RFP text';
      const result = validateRfpText(text);
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
    });

    it('rejects text with eval', () => {
      const text = 'eval(malicious code)';
      const result = validateRfpText(text);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('suspicious');
    });

    it('rejects extremely long text', () => {
      const text = 'a'.repeat(200000);
      const result = validateRfpText(text);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });
});

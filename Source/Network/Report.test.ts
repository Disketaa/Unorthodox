import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fold, reportLine, note, getDiagnosticsReport } from './Report';

vi.mock('@/Core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/Core')>();
  const log = vi.fn();
  return {
    ...actual,
    createLogger: vi.fn(() => log),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reportLine', () => {
  test('builds stamp and body', () => {
    const { stamp, body } = reportLine('info', 'hello', ['world']);
    expect(stamp).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    expect(body).toBe('info hello world');
  });

  test('serializes non-string values', () => {
    const { body } = reportLine('warn', 'code', [42, { x: 1 }, null]);
    expect(body).toContain('42');
    expect(body).toContain('{"x":1}');
    expect(body).toContain('null');
  });
});

describe('fold', () => {
  test('returns true for new line', () => {
    expect(fold('00:00:00.000 ', 'new line')).toBe(true);
  });

  test('returns false for repeated line', () => {
    fold('00:00:00.000 ', 'repeat me');
    expect(fold('00:00:00.001 ', 'repeat me')).toBe(false);
  });

  test('increments count on repeat', () => {
    fold('00:00:00.000 ', 'repeat me');
    fold('00:00:00.001 ', 'repeat me');
    expect(fold('00:00:00.002 ', 'repeat me')).toBe(false);
  });
});

describe('note', () => {
  test('does not throw on new line', () => {
    expect(() => note('info', 'hello')).not.toThrow();
  });

  test('does not throw on repeat', () => {
    expect(() => note('info', 'repeat')).not.toThrow();
    expect(() => note('info', 'repeat')).not.toThrow();
  });
});

describe('getDiagnosticsReport', () => {
  test('includes agent and href', () => {
    const originalNavigator = globalThis.navigator;
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'test-agent' },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { location: { href: 'http://test/' } },
      configurable: true,
    });
    try {
      const report = getDiagnosticsReport();
      expect(report).toContain('agent test-agent');
      expect(report).toContain('href http://test/');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      });
    }
  });
});

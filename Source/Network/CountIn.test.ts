import { describe, test, expect, afterEach, beforeEach } from 'vitest';
import { hasCountedIn, markCountedIn, clearCountIn } from './CountIn';

const originalStorage = globalThis.localStorage;

class FakeStorage implements Storage {
  private readonly store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    const entries = [...this.store.entries()];
    return entries[index]?.[0] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

class ThrowingStorage implements Storage {
  get length(): number {
    throw new Error('storage unavailable');
  }
  clear(): void {
    throw new Error('storage unavailable');
  }
  getItem(): string | null {
    throw new Error('storage unavailable');
  }
  key(): string | null {
    throw new Error('storage unavailable');
  }
  removeItem(): void {
    throw new Error('storage unavailable');
  }
  setItem(): void {
    throw new Error('storage unavailable');
  }
}

beforeEach(() => {
  globalThis.localStorage = new FakeStorage();
});

afterEach(() => {
  globalThis.localStorage = originalStorage;
});

describe('CountIn', () => {
  test('hasCountedIn returns false when nothing stored', () => {
    expect(hasCountedIn('ABCD')).toBe(false);
  });

  test('hasCountedIn returns true after markCountedIn', () => {
    markCountedIn('ABCD');
    expect(hasCountedIn('ABCD')).toBe(true);
  });

  test('clearCountIn removes the mark', () => {
    markCountedIn('ABCD');
    clearCountIn('ABCD');
    expect(hasCountedIn('ABCD')).toBe(false);
  });

  test('hasCountedIn returns false when storage throws', () => {
    globalThis.localStorage = new ThrowingStorage();
    expect(hasCountedIn('ABCD')).toBe(false);
  });

  test('markCountedIn does not throw when storage throws', () => {
    globalThis.localStorage = new ThrowingStorage();
    expect(() => markCountedIn('ABCD')).not.toThrow();
  });

  test('clearCountIn does not throw when storage throws', () => {
    globalThis.localStorage = new ThrowingStorage();
    expect(() => clearCountIn('ABCD')).not.toThrow();
  });
});

import { describe, test, expect } from 'vitest';
import { assertNever } from './Types';

describe('assertNever', () => {
  test('is a function', () => {
    expect(typeof assertNever).toBe('function');
  });

  test('throws in exhaustive check default branch', () => {
    type Shape = { kind: 'circle' } | { kind: 'square' };
    function area(shape: Shape): number {
      if (shape.kind === 'circle') return 1;
      if (shape.kind === 'square') return 2;
      return assertNever(shape);
    }
    expect(area({ kind: 'circle' })).toBe(1);
    expect(area({ kind: 'square' })).toBe(2);
  });
});

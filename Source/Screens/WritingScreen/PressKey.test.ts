import { describe, test, expect } from 'vitest';
import { pressKey } from './PressKey';
import { GameConfig } from '@/Game';

describe('pressKey', () => {
  test('submits on Enter when allowed', () => {
    let submitted = false;
    pressKey(
      'Enter',
      'hello',
      true,
      () => {},
      () => {
        submitted = true;
      }
    );
    expect(submitted).toBe(true);
  });

  test('does not submit on Enter when not allowed', () => {
    let submitted = false;
    pressKey(
      'Enter',
      'hello',
      false,
      () => {},
      () => {
        submitted = true;
      }
    );
    expect(submitted).toBe(false);
  });

  test('deletes last char on Backspace', () => {
    let value = '';
    pressKey(
      'Backspace',
      'hello',
      false,
      (v) => {
        value = v;
      },
      () => {}
    );
    expect(value).toBe('hell');
  });

  test('adds letter key', () => {
    let value = '';
    pressKey(
      'a',
      '',
      false,
      (v) => {
        value = v;
      },
      () => {}
    );
    expect(value).toBe('a');
  });

  test('adds space on Space key', () => {
    let value = '';
    pressKey(
      'Space',
      'hello',
      false,
      (v) => {
        value = v;
      },
      () => {}
    );
    expect(value).toBe('hello ');
  });

  test('ignores letter when at max length', () => {
    const max = GameConfig.limits.answerMaxLength;
    let value = 'x'.repeat(max);
    pressKey(
      'a',
      value,
      false,
      (v) => {
        value = v;
      },
      () => {}
    );
    expect(value).toBe('x'.repeat(max));
  });

  test('allows letter one below max length', () => {
    const max = GameConfig.limits.answerMaxLength;
    let value = 'x'.repeat(max - 1);
    pressKey(
      'a',
      value,
      false,
      (v) => {
        value = v;
      },
      () => {}
    );
    expect(value).toBe('x'.repeat(max - 1) + 'a');
  });
});

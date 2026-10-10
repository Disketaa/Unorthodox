// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import type { AnswerInputProps } from './AnswerInput';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));
vi.mock('@/Design/Sounds', () => ({ playSound }));

const { AnswerInput } = await import('./AnswerInput');

/** The writing screen's field, as the room sees it. */
function props(overrides: Partial<AnswerInputProps> = {}): AnswerInputProps {
  return {
    topic: 'Что вы делаете в первые минуты в новом городе',
    theme: 'Путешествия',
    themeAccent: { wash: '#fff', ink: '#000' },
    remainingMs: 30_000,
    totalMs: 60_000,
    value: 'Осматриваюсь',
    timeUp: false,
    held: false,
    onValueChange: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe('a seat reporting itself at work', () => {
  it('says once on the way in, and stays quiet however often it is redrawn', () => {
    // Saying it tells the room, and the room answers with a redraw. A report that turned on the
    // callback rather than on the flag would fire again on that redraw, and again on the answer
    // to it, until the tab stopped answering at all — and every seat stayed marked at work.
    const onEditing = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    act(() => {
      render(<AnswerInput {...props({ onEditing })} />, root);
    });
    expect(onEditing).toHaveBeenCalledTimes(1);
    expect(onEditing).toHaveBeenCalledWith(false);

    // The room redraws, handing over a fresh callback each time, as a parent does.
    for (let frame = 0; frame < 5; frame += 1) {
      act(() => {
        render(<AnswerInput {...props({ onEditing: () => {} })} />, root);
      });
    }
    expect(onEditing).toHaveBeenCalledTimes(1);
  });

  it('goes quiet where nothing is listening', () => {
    // The report is optional: a caller with no room above it must not have to supply one.
    const root = document.createElement('div');
    document.body.appendChild(root);
    expect(() =>
      act(() => {
        render(<AnswerInput {...props()} />, root);
      })
    ).not.toThrow();
    expect(root.querySelector('input, span')).not.toBeNull();
  });
});

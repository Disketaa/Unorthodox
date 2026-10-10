// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));
vi.mock('@/Design/Sounds', () => ({ playSound }));

const { useSentAnswer } = await import('./UseSentAnswer');

/** The hook's latest reading, driven the way the keys drive it. */
function sentAnswer() {
  const seen: { clean: boolean; editing: boolean }[] = [];
  function Probe({ value }: { value: string }) {
    const state = useSentAnswer(value, vi.fn(), vi.fn());
    seen.push({ clean: state.clean, editing: state.editing });
    return (
      <>
        <button type="button" onClick={() => state.send()}>
          send
        </button>
        <button type="button" onClick={() => state.change(`${value}!`)}>
          type
        </button>
      </>
    );
  }
  const root = document.createElement('div');
  document.body.appendChild(root);
  const latest = () => seen[seen.length - 1];
  const press = (label: string) =>
    act(async () => {
      const button = [...root.querySelectorAll('button')].find((b) => b.textContent === label);
      button?.click();
    });
  return {
    latest,
    async open(value = 'Осматриваюсь') {
      await act(async () => {
        render(<Probe value={value} />, root);
      });
    },
    send: () => press('send'),
    type: () => press('type'),
  };
}

describe('an answer already sent', () => {
  it('is not being written over until the player touches it', async () => {
    const field = sentAnswer();
    await field.open();
    expect(field.latest().clean).toBe(false);
    expect(field.latest().editing).toBe(false);
  });

  it('reads as sent once it has been, and not as being written over', async () => {
    const field = sentAnswer();
    await field.open();
    await field.send();
    expect(field.latest().clean).toBe(true);
    expect(field.latest().editing).toBe(false);
  });

  it('is being written over once the player types on it, and stops the moment it is sent', async () => {
    // Back at work on a round they had finished, which is what puts their seat back to the mark.
    const field = sentAnswer();
    await field.open();
    await field.send();
    await field.type();
    expect(field.latest().clean).toBe(false);
    expect(field.latest().editing).toBe(true);

    await field.send();
    expect(field.latest().clean).toBe(true);
    expect(field.latest().editing).toBe(false);
  });
});

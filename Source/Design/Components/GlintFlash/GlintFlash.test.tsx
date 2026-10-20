// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { GlintFlash } from './GlintFlash';

const { played } = vi.hoisted(() => ({ played: new Array<string>() }));

vi.mock('../../Sounds', () => ({
  playSound: (name: string) => {
    played.push(name);
  },
}));

/** Mount a flash and hand back the shine it drew. */
function mounted(props: { variant?: 'Flash' | 'Wash'; sound?: boolean } = {}): Element | null {
  const root = document.body.appendChild(document.createElement('div'));
  act(() => {
    render(<GlintFlash {...props} />, root);
  });
  return root.firstElementChild;
}

beforeEach(() => {
  played.length = 0;
});

describe('the shine the enchantment lays over a thing', () => {
  it('is drawn over what it is put on, and takes no pointer', () => {
    // A shine covering the thing being pressed is a shine that takes the press: the seat it lies
    // over is still the seat the room is pressing.
    const shine = mounted();
    expect(shine?.getAttribute('aria-hidden')).toBe('true');
  });

  it('burns away at once, or holds before it lets go', () => {
    // Two rhythms for one mechanic: the flash that says the room has been touched, and the
    // wash that stays for as long as the word over it.
    expect(mounted({ variant: 'Flash' })?.className).toContain('Flash');
    expect(mounted({ variant: 'Wash' })?.className).toContain('Wash');
  });

  it('says the enchantment out loud when it is asked to', () => {
    // The note and the shine are one moment: the room is told the enchantment reached it, and
    // the seat that is flashed says so with the same word the word over the screen uses.
    mounted({ sound: true });
    expect(played).toEqual(['Enchant']);
  });

  it('says nothing on its own, since a shine over a card is only seen', () => {
    mounted();
    expect(played).toEqual([]);
  });
});

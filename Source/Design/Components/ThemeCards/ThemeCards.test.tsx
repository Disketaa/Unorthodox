// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { createRandom, dealThemes, ThemeId } from '@/Core';
import { ThemeCards } from './ThemeCards';

const themes: readonly ThemeId[] = dealThemes(createRandom(7), 6);
const names: Readonly<Record<ThemeId, string>> = {
  VideoGames: 'VideoGames',
  Nature: 'Nature',
  Internet: 'Internet',
  Food: 'Food',
  Music: 'Music',
  Movies: 'Movies',
  Work: 'Work',
  Travel: 'Travel',
  Random: 'Random',
};

/** Mount a bank and hand back the cards as the browser sees them. */
function mount(props: {
  onPick?: (theme: ThemeId) => void;
  picked?: ThemeId;
}): HTMLButtonElement[] {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(
      <ThemeCards themes={themes} names={names} roundsPerTheme={10} spent={4} {...props} />,
      container
    );
  });
  return [...container.querySelectorAll('button')];
}

describe('a bank nobody may press', () => {
  it('holds its cards back on a turn that is not this player’s', () => {
    // No `onPick` and nothing chosen: the bank is open and this is not your seat. Held back
    // rather than dead, since the room is watching whose turn it is come round.
    expect(mount({})[0]?.className).toContain('Waiting');
  });

  it('is at full strength the moment the room has answered', () => {
    // The answer is the same on every screen, so holding it back from whoever did not press it
    // would be dimming the room's own decision rather than showing a private one.
    const chosen = themes[0];
    if (chosen === undefined) throw new Error('no themes dealt');
    expect(mount({ picked: chosen })[0]?.className).not.toContain('Waiting');
  });

  it('stays at full strength on every screen, pressed or not', () => {
    const chosen = themes[0];
    if (chosen === undefined) throw new Error('no themes dealt');
    const pressed = mount({ onPick: () => {}, picked: chosen });
    const watching = mount({ picked: chosen });
    expect(pressed.map((card) => card.className)).toEqual(
      watching.map((card) => card.className)
    );
  });

  it('is never waiting on the player whose turn it is', () => {
    expect(mount({ onPick: () => {} })[0]?.className).not.toContain('Waiting');
  });
});

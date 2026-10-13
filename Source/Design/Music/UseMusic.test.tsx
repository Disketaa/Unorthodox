// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

const { playMusic, stopMusic } = vi.hoisted(() => ({
  playMusic: vi.fn(),
  stopMusic: vi.fn(),
}));
vi.mock('./MusicBank', () => ({ playMusic, stopMusic }));

const { useMusic } = await import('./UseMusic');

/** A screen asking for a track, drawn and then taken down again, the way a menu is when the room
 * it was waiting for arrives. */
async function shown(track: 'Menu' | 'Game' | 'Voting', seconds?: number) {
  function View() {
    useMusic(track, seconds);
    return <div />;
  }
  const root = document.createElement('div');
  document.body.appendChild(root);
  await act(async () => {
    render(<View />, root);
  });
  await act(async () => {
    render(null, root);
  });
}

describe('the music a screen asks for', () => {
  beforeEach(() => {
    playMusic.mockClear();
    stopMusic.mockClear();
  });

  it('asks the bank for the track the screen is on', async () => {
    await shown('Menu');
    expect(playMusic).toHaveBeenCalledWith('Menu', undefined);
  });

  it('does not stop the music when the screen goes, since the next one may want it', async () => {
    // The menu and a room still in its lobby are the same track, and stopping
    // between them starts a second copy of one loop over the fading first.
    await shown('Menu');
    expect(stopMusic).not.toHaveBeenCalled();
  });

  it('gives the handover the length it was handed, so a fade can finish with a transition', async () => {
    await shown('Game', 0.75);
    expect(playMusic).toHaveBeenCalledWith('Game', 0.75);
  });
});

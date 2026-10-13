// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { VolumeButton } from '../VolumeButton/VolumeButton';
import { MusicButton } from './MusicButton';

const labels = {
  mute: 'Выключить звук',
  unmute: 'Включить звук',
  musicOn: 'Включить музыку',
  musicOff: 'Выключить музыку',
};

/** Both switches drawn side by side, as they sit in the lobby's settings card. */
async function settings() {
  const root = document.createElement('div');
  document.body.appendChild(root);
  await act(async () => {
    render(
      <>
        <VolumeButton labels={labels} />
        <MusicButton labels={labels} />
      </>,
      root
    );
  });
  const buttons = [...root.querySelectorAll('button')];
  const labelsNow = () =>
    [...root.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
  return {
    labelsNow,
    async press(index: number) {
      await act(async () => {
        buttons[index]?.click();
      });
      return labelsNow();
    },
  };
}

describe('the two room switches', () => {
  it('both start heard, each naming what turning it off does', async () => {
    const drawn = await settings();
    expect(drawn.labelsNow()).toEqual([labels.mute, labels.musicOff]);
  });

  it('one switch leaves the other saying what it says', async () => {
    // Two controls governing two things, so silencing the room's presses
    // cannot be read as having silenced the track.
    const drawn = await settings();
    expect(await drawn.press(0)).toEqual([labels.unmute, labels.musicOff]);
    expect(await drawn.press(1)).toEqual([labels.unmute, labels.musicOn]);
  });
});

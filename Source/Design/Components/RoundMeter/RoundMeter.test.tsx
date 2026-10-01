// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { RoundMeter } from './RoundMeter';

/** The meter as one role sees it: its ticks, and how many of them are greyed. */
function meter(rounds: number, pending: number) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(<RoundMeter rounds={rounds} pending={pending} />, container);
  });
  const root = container.firstElementChild;
  if (root === null) {
    throw new Error('no meter rendered');
  }
  const greyed = [...root.querySelectorAll('span')].filter((tick) =>
    (tick.getAttribute('class') ?? '').includes('Pending'),
  );
  return { root, ticks: root.querySelectorAll('span'), greyed };
}

describe('the round ticks on a card', () => {
  it('draws one tick per round of the theme', () => {
    // The number of topics the theme answers for, and the length of the row: a card showing
    // fewer ticks than the theme has rounds says the theme is shorter than it is.
    expect(meter(10, 1).ticks).toHaveLength(10);
    expect(meter(3, 1).ticks).toHaveLength(3);
  });

  it('greys exactly the one tick still to play', () => {
    // Every other tick is the theme's own colour, so a second greyed one would be two
    // answers to what is left, and none at all would say a theme with nothing to play.
    expect(meter(10, 1).greyed).toHaveLength(1);
    expect(meter(10, 7).greyed).toHaveLength(1);
  });

  it('greys the last tick unless it is told otherwise', () => {
    // A row that fills left to right draws the eye to the tick at the start; a row that
    // empties from the start draws it to the end, which is the far end of the theme — where
    // the row is counting to. The last tick is also the only one that can be right without
    // knowing the room's progress at all.
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<RoundMeter rounds={10} />, container);
    });
    const ticks = [...(container.firstElementChild?.querySelectorAll('span') ?? [])];
    const isPending = (tick: Element) =>
      (tick.getAttribute('class') ?? '').includes('Pending');
    expect(ticks.filter(isPending)).toHaveLength(1);
    expect(ticks.findIndex(isPending)).toBe(9);
  });

  it('greys a tick that is still there rather than leaving a hole', () => {
    // An absent tick reads as one that was missed; the theme has been chosen, so every round
    // on it is going to happen and this one has simply not happened yet. The row stays ten
    // long whatever the room has got to.
    expect(meter(10, 4).ticks).toHaveLength(10);
  });

  it('moves the greyed tick along as rounds are played', () => {
    // Playing the greyed tick is the whole of what a round advancing looks like here: it
    // takes the colour of the nine beside it and the next one greys.
    const position = (pending: number) =>
      [...meter(10, pending).ticks].findIndex((tick) =>
        (tick.getAttribute('class') ?? '').includes('Pending'),
      );
    expect(position(1)).toBe(0);
    expect(position(4)).toBe(3);
    expect(position(10)).toBe(9);
  });

  it('says nothing at all to a screen reader', () => {
    // Ten ticks read out as a burst of punctuation, and the tick that matters is the grey
    // one, which a screen reader cannot see. The card's name is what is announced.
    expect(meter(10, 4).root.getAttribute('aria-hidden')).toBe('true');
    expect(meter(10, 4).root.textContent).toBe('');
  });
});

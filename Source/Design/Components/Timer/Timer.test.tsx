// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';

const playSound = vi.fn();
vi.mock('../../Sounds', () => ({ playSound }));

const { Timer } = await import('./Timer');

beforeEach(() => {
  playSound.mockClear();
});

/** The block as one role sees it: what it says, and how much of it is filled. */
function block(remainingMs: number, totalMs = 60_000, urgent = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(
      <Timer
        remainingMs={remainingMs}
        totalMs={totalMs}
        seconds={`${Math.ceil(remainingMs / 1000)}`}
        urgent={urgent}
      >
        Голосуем за ответы…
      </Timer>,
      container
    );
  });
  const root = container.firstElementChild;
  if (root === null) {
    throw new Error('no block rendered');
  }
  const bar = root.querySelector('div > div');
  return { root, fill: bar === null ? null : bar.getAttribute('style') };
}
function fillOf(container: HTMLElement): string {
  return container.querySelector('div')?.style.getPropertyValue('--Timer-Fill') ?? '';
}

describe('the countdown block', () => {
  it('says the phase and the seconds left', () => {
    // The sentence is inside the block rather than above it, and the figure is at its head. Drawn
    // twice over one another — the light layer is the same content clipped to the fill — so what
    // has to hold is that both layers say the same thing, since the eye reads whichever one the
    // fill is over.
    expect(block(30_000).root.textContent).toBe('30Голосуем за ответы…30Голосуем за ответы…');
  });

  it('hides the upper layer from a screen reader, since it repeats the lower one', () => {
    // Two copies of the sentence is one sentence with an echo. The upper copy is the same words
    // clipped to the fill, so it is hidden and only the lower one is read.
    const layers = [...block(30_000).root.querySelectorAll('div')];
    expect(layers).toHaveLength(3);
    expect(layers[2].getAttribute('aria-hidden')).toBe('true');
  });

  it('fills from the left in proportion to what is left of the phase', () => {
    expect(block(60_000).fill).toContain('width: 100%');
    expect(block(30_000).fill).toContain('width: 50%');
    expect(block(0).fill).toContain('width: 0%');
  });

  it('is empty rather than broken by a phase with no length set', () => {
    // A phase nobody waits out has no total to divide by, and the block still has to draw.
    expect(block(30_000, 0).fill).toContain('width: 0%');
  });

  it('turns to the alarm tone only when the phase is nearly out', () => {
    // Whether a phase is late is the game's number, not this block's, so the block is told. A
    // block that decided for itself would go off on a phase the room chose to give a long wait.
    expect(block(30_000).root.className).not.toContain('Urgent');
    expect(block(30_000, 60_000, true).root.className).toContain('Urgent');
  });

  it('ticks once per second it shows, and not on the frames between', () => {
    // The countdown re-renders several times a second, so a beat keyed on the clock itself would
    // be several sounds for one number and the count would come out as a buzz.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const draw = (remainingMs: number) =>
      act(() => {
        render(
          <Timer
            remainingMs={remainingMs}
            totalMs={60_000}
            seconds={`${Math.ceil(remainingMs / 1000)}`}
          >
            Голосуем за ответы…
          </Timer>,
          container
        );
      });
    draw(30_000);
    draw(29_900);
    draw(29_800);
    draw(29_000);
    expect(playSound.mock.calls).toEqual([
      ['Tick', undefined],
      ['Tick', undefined],
    ]);
  });

  it('ticks on the last second it shows, and says nothing at zero', () => {
    // The block plays only the beat. The alarm at the end of a phase is not its to sound — the
    // frame that would draw zero is routinely the frame that draws the next phase — so a block
    // given a phase without a clock under it, as the gallery draws one, stays silent.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const draw = (remainingMs: number) =>
      act(() => {
        render(
          <Timer
            remainingMs={remainingMs}
            totalMs={60_000}
            seconds={`${Math.ceil(remainingMs / 1000)}`}
          >
            Голосуем за ответы…
          </Timer>,
          container
        );
      });
    draw(30_000);
    draw(2_000);
    draw(1_000);
    // Zero is not a beat: by the time a client running ahead of the host's clock gets there, the
    // phase has already changed.
    draw(0);
    expect(playSound.mock.calls).toEqual([
      ['Tick', undefined],
      ['Tick', undefined],
      ['Tick', undefined],
    ]);
  });

  it('pitches the beat up as the phase closes in, and leaves it alone before that', () => {
    // A run of identical notes is a printed loop; the rise is what makes the last seconds sound
    // like the phase closing rather than like the same second again. Zero is left to the bank's
    // own scatter, since that is a beat that is not carrying anything yet.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const draw = (remainingMs: number, beatSemitones = 0) =>
      act(() => {
        render(
          <Timer
            remainingMs={remainingMs}
            totalMs={60_000}
            seconds={`${Math.ceil(remainingMs / 1000)}`}
            beatSemitones={beatSemitones}
          >
            Голосуем за ответы…
          </Timer>,
          container
        );
      });
    draw(30_000, 0);
    draw(4_000, 1);
    draw(3_000, 2);
    draw(2_000, 3);
    expect(playSound.mock.calls).toEqual([
      ['Tick', undefined],
      ['Tick', 1],
      ['Tick', 2],
      ['Tick', 3],
    ]);
  });

  it('takes the fill colour of whoever the phase belongs to', () => {
    // Written onto the element as a custom property rather than as a class per tint: eight tints
    // are eight colours, and eight rules would have to be kept in step with the palette.
    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(
        <Timer remainingMs={30_000} totalMs={60_000} seconds="30" tint="#e0559a">
          Соня выбирает тему…
        </Timer>,
        container
      );
    });
    expect(fillOf(container)).toBe('#e0559a');
  });

  it('gives the colour back when the phase stops belonging to one player', () => {
    // A room's turn hands on, and the next phase belongs to everyone. A property left on the
    // element outlives the phase that set it, so the bar would keep saying somebody's turn to
    // whoever is watching it.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const draw = (tint?: string) =>
      act(() => {
        render(
          <Timer remainingMs={30_000} totalMs={60_000} seconds="30" tint={tint}>
            Голосуем за ответы…
          </Timer>,
          container
        );
      });
    draw('#e0559a');
    draw(undefined);
    expect(fillOf(container)).toBe('');
  });

  it('says nothing at all where there is no phase to count', () => {
    // A block with no length behind it is not the end of a game, and the gallery renders one.
    block(30_000, 0);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('says how much of itself is left to a screen reader', () => {
    // The figure is drawn as text, so it reads, but what a screen reader can use is how far
    // through the phase the room is: that is the number, not the drawing.
    expect(block(30_000).root.getAttribute('role')).toBe('progressbar');
    expect(block(30_000).root.getAttribute('aria-valuenow')).toBe('50');
    expect(block(30_000).root.getAttribute('aria-valuemin')).toBe('0');
    expect(block(30_000).root.getAttribute('aria-valuemax')).toBe('100');
  });
});

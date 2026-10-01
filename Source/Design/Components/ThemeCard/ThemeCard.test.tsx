// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { ThemeCard } from './ThemeCard';
import { Accents, ThemeId, ThemeIds, themeAccent } from '@/Core';

/** The card as one role sees it, mounted with its effects flushed. */
function card(theme: ThemeId = 'Internet', index?: number) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  // The accent and the sway are both written from effects, so the card is mounted inside
  // `act`: without it the write has not happened yet and the card reads as having no colour
  // and no movement at all.
  act(() => {
    render(<ThemeCard theme={theme} name="Интернет" index={index} />, container);
  });
  const button = container.querySelector('button');
  if (button === null) {
    throw new Error('no card rendered');
  }
  const mark = container.querySelector('[aria-hidden="true"]');
  return { container, button, mark };
}

describe('one theme card', () => {
  it('is a button, because a card you can point at has to be one', () => {
    // A `div` with a hover on it is a control the browser cannot focus and cannot announce.
    expect(card().button.type).toBe('button');
    expect(card().button.disabled).toBe(false);
  });

  it('carries the number, the grain and the ticks all hidden from a screen reader', () => {
    // The number is a mark on the panel, not part of its name, and read out as one the theme
    // would be announced as "one, интернет". The grain carries nothing at all, and ten ticks
    // read out as a burst of punctuation. All three are `aria-hidden`, so what the DOM still
    // holds is not what is read — the name is the only thing on the card that is.
    const { container, mark } = card();
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')];
    expect(hidden).toHaveLength(3);
    expect(hidden.map((node) => node.textContent).join('')).toBe('1');
    expect(container.textContent).toBe('1Интернет');
  });

  it('writes its own accent onto itself rather than taking the colour as a prop', () => {
    // A caller that passed the colour could pass the wrong one, and two cards of one bank
    // wearing two colours would be a mistake nothing could see.
    const { button } = card('Nature');
    const accent = themeAccent('Nature');
    expect(button.style.getPropertyValue('--ThemeCard-Wash')).toBe(accent.wash);
    expect(button.style.getPropertyValue('--ThemeCard-Ink')).toBe(accent.ink);
  });

  it('washes in a colour that belongs to the palette, never a new one', () => {
    // Every wash and ink is one of the eight measured accents, so nothing new had to be
    // picked and nothing is unmeasured.
    const palette = Object.values(Accents);
    ThemeIds.forEach((theme) => {
      expect(palette).toContain(themeAccent(theme));
    });
  });

  it('keeps the name readable on its own wash, which a raw tint would not be', () => {
    // The ink step is what can be read on the wash; the raw tint behind a name fails
    // contrast in every one of the eight, which is why the wash is the pale one.
    expect(themeAccent('Internet').ink).not.toBe(themeAccent('Internet').tint);
  });

  it('lets two themes share a tint, since the palette holds fewer tints than themes', () => {
    const used = new Set(ThemeIds.map((theme) => themeAccent(theme)));
    expect(used.size).toBeLessThan(ThemeIds.length);
  });
});

describe("the card's number", () => {
  it('shows where the card sits in the bank, counted from one', () => {
    // The six in front of a player are numbered one to six whatever they are; a number out
    // of the catalogue would read as a fact about the theme the room has not agreed on.
    expect(card('Internet', 1).mark?.textContent).toBe('1');
    expect(card('Nature', 6).mark?.textContent).toBe('6');
  });

  it('draws one figure, not a sentence of them', () => {
    // A single number is the panel's substance; anything more behind the name competes with
    // it, and the name is what the card is for.
    expect(card().mark?.textContent?.length).toBe(1);
  });

  it('is a single text node, so the browser is not laying out a hundred boxes', () => {
    expect(card().mark?.children).toHaveLength(0);
  });
});

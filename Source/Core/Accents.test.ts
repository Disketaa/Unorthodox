import { describe, it, expect } from 'vitest';
import { contrastRatio, parseHex } from './Color';
import { CharacterColors } from './Characters';
import { Accents, DefaultAccent, allAccents } from './Accents';

/** WCAG 2.1 AA. Body text and anything below 24px is held to the higher bar. */
const BodyText = 4.5;
const LargeText = 3;

const Ink = '#212121';
const White = '#ffffff';
const Paper = '#fafafa';

function ratio(a: string, b: string): number {
  const first = parseHex(a);
  const second = parseHex(b);
  if (!first || !second) throw new Error(`unreadable colour in ${a} / ${b}`);
  return contrastRatio(first, second);
}

describe('the palette itself', () => {
  it('covers every tint and no others', () => {
    // A tint added without an accent would leave the app on the previous colour,
    // and one added twice would mean the list has drifted from the cast.
    expect(Object.keys(Accents).sort()).toEqual([...CharacterColors].sort());
  });

  it('parses as a colour, every step of every ramp', () => {
    for (const { accent } of allAccents()) {
      for (const step of Object.values(accent)) {
        expect(parseHex(step)).toBeDefined();
      }
    }
  });

  it('names a default that is a real accent, and it is yellow', () => {
    // Yellow is the accent the game had before tints could choose one, so a device
    // with nothing stored comes back looking like the first version of this app.
    expect(DefaultAccent).toBe('Yellow');
    expect(Accents[DefaultAccent]).toBeDefined();
  });

  it('gives every accent the same label colour, so no button changes weight', () => {
    // The text on a filled control is one value for the whole palette rather than one
    // chosen per accent. All eight pass against ink at rest and on hover, so there is
    // nothing to choose between them.
    for (const { color, accent } of allAccents()) {
      expect(accent.on, `${color} on`).toBe(Ink);
    }
  });

  it('has a distinct hue from every other, so two players read as different', () => {
    // The roster shows other players in their own tints, so two accents that are
    // too close would make two players look like one.
    const bases = allAccents().map(({ accent }) => accent.base);
    expect(new Set(bases).size).toBe(CharacterColors.length);
  });
});

describe('a filled accent', () => {
  it('carries a button label in ink at every step the pointer can reach', () => {
    // This is the whole reason hover and active lighten. A darker step lowers the
    // ratio against dark ink, so a conventional darken ramp would put the label
    // below the floor at exactly the moment the pointer is on the button.
    for (const { color, accent } of allAccents()) {
      expect(ratio(accent.base, Ink), `${color} base`).toBeGreaterThanOrEqual(BodyText);
      expect(ratio(accent.hover, Ink), `${color} hover`).toBeGreaterThanOrEqual(BodyText);
      expect(ratio(accent.active, Ink), `${color} active`).toBeGreaterThanOrEqual(BodyText);
    }
  });

  it('never darkens on hover or press', () => {
    // The monotonic guarantee behind the previous test, stated on its own so a
    // ramp edited in the wrong direction fails here rather than in the ratios.
    for (const { color, accent } of allAccents()) {
      const base = parseHex(accent.base);
      const hover = parseHex(accent.hover);
      const active = parseHex(accent.active);
      if (!base || !hover || !active) throw new Error('unreadable step');
      expect(hover.r + hover.g + hover.b, `${color} hover`).toBeGreaterThan(
        base.r + base.g + base.b,
      );
      expect(active.r + active.g + active.b, `${color} active`).toBeGreaterThan(
        hover.r + hover.g + hover.b,
      );
    }
  });
});

describe('an accent drawn on a light surface', () => {
  it('reads as body text in the ink step, on every surface it lands on', () => {
    // Titles, scores, borders and focus rings. Both surfaces are checked because the
    // paper texture is not white, and tuning against white alone left Coral short.
    for (const { color, accent } of allAccents()) {
      expect(ratio(accent.ink, White), `${color} ink on white`).toBeGreaterThanOrEqual(BodyText);
      expect(ratio(accent.ink, Paper), `${color} ink on paper`).toBeGreaterThanOrEqual(BodyText);
    }
  });

  it('shows the raw tint cannot do that job, so the ink step is not redundant', () => {
    // If a tint ever passed as body text the separate step would be duplication. This
    // is the measurement that justifies it, and it fails loudly if a future palette
    // change made the step unnecessary.
    const passing = allAccents().filter(({ accent }) => ratio(accent.base, White) >= BodyText);
    expect(passing).toEqual([]);
  });

  it('clears the large-text bar in the bright step, which is the headings', () => {
    // `bright` sits between the tint and the ink step: brighter, and closer to the
    // colour the character wears, while still clearing 3:1 on the lighter of the two
    // surfaces. Violet and Rose are the raw tints here, because those already pass.
    for (const { color, accent } of allAccents()) {
      expect(ratio(accent.bright, White), `${color} bright on white`).toBeGreaterThanOrEqual(LargeText);
      expect(ratio(accent.bright, Paper), `${color} bright on paper`).toBeGreaterThanOrEqual(LargeText);
    }
  });

  it('is brighter than the ink step it sits beside', () => {
    // The two are different steps on purpose, so an edit that collapses one onto the
    // other fails here rather than quietly changing every heading.
    for (const { color, accent } of allAccents()) {
      const bright = parseHex(accent.bright);
      const ink = parseHex(accent.ink);
      if (!bright || !ink) throw new Error('unreadable step');
      expect(bright.r + bright.g + bright.b, `${color}`).toBeGreaterThan(ink.r + ink.g + ink.b);
    }
  });
});

/**
 * The game title and the section headings are set in the raw tint, which is a choice
 * and not an oversight. This test is here so the cost of the choice stays visible
 * rather than being discovered later by someone who has to fix it.
 *
 * At the tint, the eight measure: Rose 3.54, Violet 3.53, Coral 3.05, Sky 2.97,
 * Mint 2.61, Lime 2.50, Amber 2.04, Yellow 1.85 against white. Three clear the 3:1
 * bar for large text; five do not. Changing this back is a one-line edit to
 * `--Color-Text-Title` and `--Color-Text-Display` in `Tokens.css`.
 */
describe('the headings, which are exempt on purpose', () => {
  it('records which tints miss the large-text bar at the tint', () => {
    const failing = allAccents()
      .filter(({ accent }) => ratio(accent.tint, White) < LargeText)
      .map(({ color }) => color);
    // Amber and Yellow are the two that are plainly short of it; the rest sit close
    // enough to the line that a small palette edit could move them either way.
    expect(failing).toEqual(['Amber', 'Yellow', 'Lime', 'Mint', 'Sky']);
  });
});
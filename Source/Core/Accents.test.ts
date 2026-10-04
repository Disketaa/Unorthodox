import { describe, it, expect } from 'vitest';
import { contrastRatio, parseHex } from './Color';
import { CharacterColors } from './Characters';
import { Accents, DefaultAccent, allAccents } from './Accents';

/** WCAG 2.1 AA. Body text and anything below 24px is held to the higher bar. */
const BodyText = 4.5;
const LargeText = 3;

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

  it('parses as a colour, every step of every accent', () => {
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

  it('has a distinct hue from every other, so two players read as different', () => {
    // The roster shows other players in their own tints, so two accents that are too
    // close would make two players look like one.
    const tints = allAccents().map(({ accent }) => accent.tint);
    expect(new Set(tints).size).toBe(CharacterColors.length);
  });
});

describe('the ink step', () => {
  it('reads as body text on every surface it lands on', () => {
    // Titles, scores, borders and focus rings. Both surfaces are checked because the
    // paper texture is not white, and tuning against white alone left Coral short.
    for (const { color, accent } of allAccents()) {
      expect(ratio(accent.ink, White), `${color} ink on white`).toBeGreaterThanOrEqual(BodyText);
      expect(ratio(accent.ink, Paper), `${color} ink on paper`).toBeGreaterThanOrEqual(BodyText);
    }
  });

  it('shows the raw tint cannot do that job, so the step is not redundant', () => {
    // If a tint ever passed as body text the separate step would be duplication. This
    // is the measurement that justifies it, and it fails loudly if a future palette
    // change made the step unnecessary.
    const passing = allAccents().filter(({ accent }) => ratio(accent.tint, White) >= BodyText);
    expect(passing).toEqual([]);
  });

  it('is darker than the tint it is taken from, in every case', () => {
    for (const { color, accent } of allAccents()) {
      const tint = parseHex(accent.tint);
      const ink = parseHex(accent.ink);
      if (!tint || !ink) throw new Error('unreadable step');
      expect(ink.r + ink.g + ink.b, color).toBeLessThan(tint.r + tint.g + tint.b);
    }
  });
});

describe('the wash step', () => {
  it('is paler than the tint, so a chosen cell reads as filled rather than lined', () => {
    for (const { color, accent } of allAccents()) {
      const tint = parseHex(accent.tint);
      const wash = parseHex(accent.wash);
      if (!tint || !wash) throw new Error('unreadable step');
      expect(wash.r + wash.g + wash.b, color).toBeGreaterThan(tint.r + tint.g + tint.b);
    }
  });

  it('is close enough to white to be a tint rather than a second surface', () => {
    // The wash carries no contrast requirement of its own, since nothing is written
    // on it, but it has to stay recognisably the same hue as the tint it came from.
    for (const { color, accent } of allAccents()) {
      expect(ratio(accent.wash, White), `${color} wash on white`).toBeLessThan(1.2);
    }
  });
});

/**
 * The game title and the section headings are set in the raw tint, which is a
 * choice and not an oversight. This test is here so the cost of the choice
 * stays visible rather than being discovered later by someone who has to fix
 * it.
 *
 * At the tint, the eight measure: Rose 3.54, Violet 3.53, Coral 3.05, Sky 2.97,
 * Mint 2.61, Lime 2.50, Amber 2.04, Yellow 1.85 against white. Three clear the
 * 3:1 bar for large text; five do not. Changing this back is a one-line edit to
 * `--Color-Text-Title` and `--Color-Text-Display` in `Tokens.css`.
 */
describe('the headings, which are exempt on purpose', () => {
  it('records which tints miss the large-text bar at the tint', () => {
    const failing = allAccents()
      .filter(({ accent }) => ratio(accent.tint, White) < LargeText)
      .map(({ color }) => color);
    expect(failing).toEqual(['Amber', 'Yellow', 'Lime', 'Mint', 'Sky']);
  });
});
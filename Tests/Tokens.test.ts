import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrastRatio, parseHex } from '../Source/Core/Color';

/** The two filled buttons, which are the only pair that ever sits side by side. These live in
 * `Tokens.css` rather than in `Core/Accents.ts`, because the primary is the fixed gold and the
 * secondary is the info cyan: neither is an accent step any more, since both are meant to look
 * the same to every player in the room. So the test reads the stylesheet instead of the
 * palette. It is out here rather than under `Source/` because it reads a file with `node:fs`,
 * and widening the app's TypeScript `types` to allow that would let browser code import Node
 * built-ins. `Tests/` is outside the app's `tsconfig` and vitest still picks the file up. */
const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);

/** WCAG AA for body text. The button labels are 16px, so this is the bar. */
const BodyText = 4.5;
const Ink = '#212121';

function ratio(a: string, b: string): number {
  const first = parseHex(a);
  const second = parseHex(b);
  if (!first || !second) throw new Error(`unreadable colour in ${a} / ${b}`);
  return contrastRatio(first, second);
}

/** The hex a token resolves to, following a `var()` to whatever it points at. */
function tokenValue(name: string, depth = 0): string {
  const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`, 'i'));
  const value = match?.[1]?.trim();
  if (value === undefined) throw new Error(`no token found for ${name}`);
  const reference = value.match(/^var\((--[a-z-]+)\)$/i);
  if (reference?.[1] === undefined) return value;
  if (depth > 4) throw new Error(`var() chain too deep at ${name}`);
  return tokenValue(reference[1], depth + 1);
}

/** How much darker one colour is than another, as a share of its own brightness. */
function shareDarkened(from: string, to: string): number {
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) throw new Error('unreadable colour');
  const brightness = (c: { r: number; g: number; b: number }) => c.r + c.g + c.b;
  return 1 - brightness(b) / brightness(a);
}

const Primary = (step: 'Background' | 'Hover' | 'Active') =>
  tokenValue(`--Color-Action-Primary-${step}`);
const Secondary = (step: 'Background' | 'Hover' | 'Active') =>
  tokenValue(`--Color-Action-Secondary-${step}`);

describe('the two filled buttons', () => {
  it('darkens both by the same amount on hover', () => {
    // A hover only one of them had read as the other one being pressed, so the step
    // is compared rather than the hex: two different colours cannot share a hex.
    expect(shareDarkened(Primary('Background'), Primary('Hover'))).toBeCloseTo(
      shareDarkened(Secondary('Background'), Secondary('Hover')),
      2,
    );
  });

  it('darkens both by the same amount when pressed', () => {
    expect(shareDarkened(Primary('Hover'), Primary('Active'))).toBeCloseTo(
      shareDarkened(Secondary('Hover'), Secondary('Active')),
      2,
    );
  });

  it('goes further on press than on hover, in both', () => {
    // A press that was shallower than the hover would read as the button letting go.
    expect(shareDarkened(Primary('Hover'), Primary('Active'))).toBeGreaterThan(
      shareDarkened(Primary('Background'), Primary('Hover')),
    );
    expect(shareDarkened(Secondary('Hover'), Secondary('Active'))).toBeGreaterThan(
      shareDarkened(Secondary('Background'), Secondary('Hover')),
    );
  });

  it('keeps the label readable at every step of both', () => {
    // The cyan is the darker of the two and so decides how far the steps may go.
    for (const [name, value] of [
      ['primary at rest', Primary('Background')],
      ['primary on hover', Primary('Hover')],
      ['primary pressed', Primary('Active')],
      ['secondary at rest', Secondary('Background')],
      ['secondary on hover', Secondary('Hover')],
      ['secondary pressed', Secondary('Active')],
    ]) {
      expect(ratio(value, Ink), name).toBeGreaterThanOrEqual(BodyText);
    }
  });

  it('leaves the two buttons different colours, which is the point of two buttons', () => {
    expect(Primary('Background')).not.toBe(Secondary('Background'));
  });

  it('gives the room yellow to the crown, the local chip and the primary button', () => {
    // All four marks say something the whole room would agree on, so none of them
    // follows the viewer's own tint. One token rather than four copies is what keeps
    // "the yellow" a single decision.
    expect(tokenValue('--Color-Room-Yellow')).toBe(Primary('Background'));
  });

  it('draws the focus ring in the same cyan as the create-room button', () => {
    // Where the keyboard is is the same fact for everyone, and a ring that moved with
    // the accent was the hardest thing for a keyboard player to find.
    expect(tokenValue('--Color-Border-Focus')).toBe(Secondary('Background'));
  });
});

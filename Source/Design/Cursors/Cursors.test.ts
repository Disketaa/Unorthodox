// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { accentFor } from '@/Core';
import { cursorTokens, hasFinePointer } from './Cursors';

/** The value a token was given, with the data URL decoded back into SVG. */
function svgFor(tokens: [string, string][], name: string): string {
  const value = tokens.find(([token]) => token === name)?.[1];
  if (value === undefined) throw new Error(`no cursor for ${name}`);
  const encoded = value.match(/data:image\/svg\+xml,([^)]*)\)/)?.[1];
  if (encoded === undefined) throw new Error(`not a data url: ${value.slice(0, 60)}`);
  return decodeURIComponent(encoded);
}

describe('the drawn cursors', () => {
  const tokens = cursorTokens(accentFor('Coral').base);

  it('paints the body in the tint', () => {
    // `cursor` takes a URL and nothing else, so the colour has to be baked into the
    // file rather than set by a property. This is the only thing that can tint one.
    expect(svgFor(tokens, '--Cursor-Default')).toContain('fill="#ef6a5a"');
  });

  it('keeps the black outline, which is what draws the cursor against the paper', () => {
    // The app is paper-coloured, so the outline is the part that has to stay put: a
    // cursor whose outline went the same colour as its body would disappear into a
    // tint of itself. This is the arrangement a character uses, tinted body under
    // black linework.
    const svg = svgFor(tokens, '--Cursor-Default');
    expect(svg).toContain('fill="black"');
    expect(svg).not.toContain('fill="white"');
  });

  it('tints all four, since every one of them is drawn the same way', () => {
    for (const name of [
      '--Cursor-Default',
      '--Cursor-Pointer',
      '--Cursor-NotAllowed',
      '--Cursor-Text',
    ]) {
      const svg = svgFor(tokens, name);
      expect(svg, name).toContain('fill="#ef6a5a"');
      expect(svg, name).not.toContain('fill="white"');
    }
  });

  it('keeps the hotspot, so the cursor still aims where the player points', () => {
    // The aim point is the whole reason the numbers are restated per cursor, and a
    // tint that moved it would be worse than no tint at all.
    expect(tokens.find(([n]) => n === '--Cursor-Default')?.[1]).toContain('4 0,');
    expect(tokens.find(([n]) => n === '--Cursor-Pointer')?.[1]).toContain('12 0,');
    expect(tokens.find(([n]) => n === '--Cursor-NotAllowed')?.[1]).toContain('2 3,');
    expect(tokens.find(([n]) => n === '--Cursor-Text')?.[1]).toContain('16 16,');
  });

  it('keeps the platform keyword behind every image', () => {
    // If an image cannot be loaded the browser shows this instead, which is what
    // keeps the cursor usable when the data URL is rejected.
    expect(tokens.find(([n]) => n === '--Cursor-Default')?.[1]).toContain(', default');
    expect(tokens.find(([n]) => n === '--Cursor-Pointer')?.[1]).toContain(', pointer');
    expect(tokens.find(([n]) => n === '--Cursor-NotAllowed')?.[1]).toContain(', not-allowed');
    expect(tokens.find(([n]) => n === '--Cursor-Text')?.[1]).toContain(', text');
  });

  it('escapes nothing that would break the URL', () => {
    // A raw `#` in a data URL is read as a fragment, which silently loses the colour.
    const value = tokens.find(([n]) => n === '--Cursor-Default')?.[1] ?? '';
    const encoded = value.match(/data:image\/svg\+xml,([^)]*)\)/)?.[1] ?? '';
    expect(encoded).not.toContain('#');
  });
});

describe('which devices get the drawn cursors', () => {
  it('asks the same question the stylesheet does', () => {
    // A property written from JavaScript applies wherever it is read, so without this
    // check a phone would be handed four cursor images it cannot draw.
    expect(typeof hasFinePointer()).toBe('boolean');
  });
});
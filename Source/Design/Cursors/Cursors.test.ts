// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { accentFor } from '@/Core';
import { cursorTokens } from './Cursors';

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

  it('keeps no unpainted black behind, since the drawing is one flat silhouette', () => {
    // Nothing is left in the tint's place to show through, and nothing is left in
    // black to be seen: the whole cursor is the accent now.
    const svg = svgFor(tokens, '--Cursor-Default');
    expect(svg).not.toContain('fill="black"');
    expect(svg).not.toContain('fill="white"');
  });

  it('carries no stroke, so the only edge is the shape itself', () => {
    // A thin rim was visible around the drawn cursor and it was not in the file: none
    // of the four declares a stroke, so what shows is the rasteriser blending the
    // silhouette's last pixel with the paper. A stroke would have been a second
    // source of that line and is what this rules out.
    for (const name of [
      '--Cursor-Default',
      '--Cursor-Pointer',
      '--Cursor-NotAllowed',
      '--Cursor-Text',
    ]) {
      expect(svgFor(tokens, name), name).not.toContain('stroke');
    }
  });

  it('paints one flat shape, so nothing is drawn twice', () => {
    // Each file is a single path. Two of them used to be drawn as an outer shape and
    // an inner copy, and that is where a seam between the two would have come from.
    for (const name of [
      '--Cursor-Default',
      '--Cursor-Pointer',
      '--Cursor-NotAllowed',
      '--Cursor-Text',
    ]) {
      const svg = svgFor(tokens, name);
      expect((svg.match(/<path/g) ?? []).length, name).toBe(1);
    }
  });
});

describe('every cursor at once', () => {
  const tokens = cursorTokens(accentFor('Coral').base);

  it('tints all four, since every one of them is drawn the same way', () => {
    for (const name of [
      '--Cursor-Default',
      '--Cursor-Pointer',
      '--Cursor-NotAllowed',
      '--Cursor-Text',
    ]) {
      const svg = svgFor(tokens, name);
      expect(svg, name).toContain('fill="#ef6a5a"');
      expect(svg, name).not.toContain('fill="black"');
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

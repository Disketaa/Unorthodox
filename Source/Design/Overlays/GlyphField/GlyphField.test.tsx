// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { createRandom } from '@/Core';
import { GlyphField } from './GlyphField';
import { rollGlyphColumn } from './RollGlyph';
import { Seeds } from './GlyphSeeds';

/** The field element inside whatever container it was rendered into. */
function fieldIn(root: HTMLElement): HTMLElement {
  const field = root.firstElementChild;
  if (!(field instanceof HTMLElement)) throw new Error('the field rendered nothing');
  return field;
}

/** The two band elements, left then right. */
function bandsIn(field: HTMLElement): HTMLElement[] {
  return Array.from(field.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
}

describe('GlyphField', () => {
  it('fills both bands', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(<GlyphField />, root);
    const bands = bandsIn(fieldIn(root));
    expect(bands).toHaveLength(2);
    for (const band of bands) {
      expect(band.querySelectorAll('span').length).toBeGreaterThanOrEqual(88);
    }
  });

  it('holds the marks from the first render rather than re-rolling on a re-render', () => {
    // The field is wallpaper: a re-render anywhere in the app must not reshuffle
    // it under the player. The drift driver writes its offset onto the field, so
    // the bands themselves are compared rather than the field's whole markup.
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(<GlyphField />, root);
    const before = bandsIn(fieldIn(root)).map((band) => band.outerHTML);
    render(<GlyphField />, root);
    expect(bandsIn(fieldIn(root)).map((band) => band.outerHTML)).toEqual(before);
  });

  it('holds a different arrangement in each band', () => {
    // Both bands come from one seed, so the second is rolled from where the
    // first stopped rather than from the start of the sequence.
    const root = document.createElement('div');
    document.body.appendChild(root);
    render(<GlyphField />, root);
    const [left, right] = bandsIn(fieldIn(root));
    expect(left?.outerHTML).not.toBe(right?.outerHTML);
  });

  it('ships eight seeds that are eight different arrangements', () => {
    // The list is the set of fields that were looked at before shipping, so two
    // seeds rolling the same field would be one wallpaper listed twice.
    const fields = Seeds.map((seed) => JSON.stringify(rollGlyphColumn(createRandom(seed))));
    expect(Seeds.length).toBe(8);
    expect(new Set(fields).size).toBe(Seeds.length);
  });

  it('rolls a usable field from every shipped seed', () => {
    // Each seed was chosen by eye, so this only guards against a roll change
    // that quietly invalidates the whole list.
    for (const seed of Seeds) {
      const marks = rollGlyphColumn(createRandom(seed));
      expect(marks).toHaveLength(44);
      expect(new Set(marks.map((mark) => mark.char)).size).toBeGreaterThan(4);
    }
  });
});

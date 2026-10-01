// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { applyAccent } from './AccentProvider';

/** A root element standing in for `<html>`. */
function rootElement(): HTMLElement {
  return document.createElement('html');
}

describe('the accent on the page', () => {
  it('puts every accent step on the element it is given', () => {
    const root = rootElement();
    applyAccent(root, 'Coral');
    expect(root.style.getPropertyValue('--Accent-Base')).toBe('#ef6a5a');
    for (const name of ['--Accent-Tint', '--Accent-Hover', '--Accent-Active', '--Accent-Ink']) {
      expect(root.style.getPropertyValue(name), name).not.toBe('');
    }
  });

  it('writes all four cursors, with the tint baked into the image', () => {
    // `cursor` takes a URL and nothing else, so the colour has to be inside the data
    // URL. A cursor token holding anything but the tinted URL is a black cursor.
    const root = rootElement();
    applyAccent(root, 'Coral');
    for (const name of [
      '--Cursor-Default',
      '--Cursor-Pointer',
      '--Cursor-NotAllowed',
      '--Cursor-Text',
    ]) {
      const value = root.style.getPropertyValue(name);
      expect(value, name).not.toBe('');
      expect(value, name).toContain('%23ef6a5a');
    }
  });

  it('recolours the cursors when the tint changes', () => {
    const root = rootElement();
    applyAccent(root, 'Coral');
    applyAccent(root, 'Sky');
    expect(root.style.getPropertyValue('--Cursor-Default')).toContain('%233d9be9');
    expect(root.style.getPropertyValue('--Accent-Base')).toBe('#3d9be9');
  });
});
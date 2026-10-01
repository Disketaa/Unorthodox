// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { applyAccent } from './AccentProvider';

/** A root element standing in for `<html>`. */
function rootElement(): HTMLElement {
  return document.createElement('html');
}

describe('the accent on the page', () => {
  it('puts every accent step on the element it is given', () => {
    // Three steps and no more. The fill, hover and press steps that were here before
    // were read by nothing once the two filled buttons became fixed colours.
    const root = rootElement();
    applyAccent(root, 'Coral');
    expect(root.style.getPropertyValue('--Accent-Tint')).toBe('#ef6a5a');
    expect(root.style.getPropertyValue('--Accent-Ink')).toBe('#ba5346');
    expect(root.style.getPropertyValue('--Accent-Wash')).toBe('#fdf0ef');
  });

  it('writes nothing else, so a step cannot linger after the last thing using it', () => {
    // The list is the whole contract with `Tokens.css`. Anything added here that
    // nothing reads is a value the palette has to keep in step for no reason.
    const root = rootElement();
    applyAccent(root, 'Coral');
    const written = Array.from(root.style).filter((name) => name.startsWith('--'));
    expect(written.sort()).toEqual(['--Accent-Ink', '--Accent-Tint', '--Accent-Wash']);
  });

  it('recolours every step when the tint changes', () => {
    const root = rootElement();
    applyAccent(root, 'Coral');
    applyAccent(root, 'Sky');
    expect(root.style.getPropertyValue('--Accent-Tint')).toBe('#3d9be9');
    expect(root.style.getPropertyValue('--Accent-Ink')).toBe('#2f77b3');
    expect(root.style.getPropertyValue('--Accent-Wash')).toBe('#ecf5fd');
  });

  it('leaves the cursors alone, since they are drawn black', () => {
    // They were tinted at one point and taken back. `cursor` takes a URL and nothing
    // else, so tinting one means rebuilding its data URL; the stylesheet keeps the
    // black versions and nothing here should disturb them.
    const root = rootElement();
    applyAccent(root, 'Coral');
    expect(root.style.getPropertyValue('--Cursor-Default')).toBe('');
  });
});
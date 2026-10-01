import { describe, it, expect } from 'vitest';
import { stylesheet } from './Stylesheet';

/**
 * The child centred in the viewport rather than in the room left below it.
 *
 * Out here for the reason the other layout tests are: happy-dom does not lay out a flex
 * container and does not give an element an offset, so nothing about this is visible to a
 * rendered component. What can be checked is the arithmetic the stylesheet expresses, which
 * is where the behaviour lives.
 */
const sheet = stylesheet('../Source/Design/Primitives/ViewportCenter/ViewportCenter.module.css');

const Root = /\.Root\s*\{([^}]*)\}/;

describe('the block centred in the viewport', () => {
  it('takes the room the stage has left, or it centres in nothing', () => {
    expect(sheet.declaration(Root, 'flex')).toBe('11auto');
    expect(sheet.declaration(Root, 'align-items')).toBe('center');
  });

  it('gives half the height above back, and no more', () => {
    // A stage with `a` above the child and `b` below centres it in the middle of `a + b`,
    // which is half a bar too low exactly when `a` is half a bar. A positive margin would
    // push the child the same distance in the wrong direction, and an unhalved one would
    // overshoot by as much again.
    expect(sheet.declaration(Root, 'margin-top')).toBe(
      'calc(-1*var(--ViewportCenter-Above,0px)/2)',
    );
  });

  it('measures the space above rather than counting what is in it', () => {
    // The number of things at the top of the game changes as phases are added, and a
    // sibling list would have needed every one of them and been wrong from the first.
    expect(sheet.text).toContain('--ViewportCenter-Above');
    expect(sheet.text).not.toContain(':first-child');
    expect(sheet.text).not.toContain(':nth-child');
  });

  it('falls back to no offset, which is a centred row rather than a wrong one', () => {
    expect(sheet.declaration(Root, 'margin-top')).toContain('0px)');
  });

  it('lets the child shrink into the room, or a tall bank pushes the page instead', () => {
    // A flex item's floor is its content by default.
    expect(sheet.declaration(Root, 'min-height')).toBe('0');
  });

  it('reads no size of its own, so one edit to the tokens moves it', () => {
    expect(sheet.text).not.toMatch(/\d+px(?!\))/);
  });
});

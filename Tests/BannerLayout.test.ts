import { describe, it, expect } from 'vitest';
import { stylesheet } from './Stylesheet';

/** The banner's own row, read from the stylesheet. Out here rather than beside the component for
 * the reason the other layout tests are: it reads a file with `node:fs`, and widening the app's
 * TypeScript `types` to allow that would let browser code import Node built-ins. And it reads
 * the file rather than rendering the component, because truncation is invisible to a test
 * runner. happy-dom does not lay out a flex row and does not clip an element, so a rendered
 * `Banner` asserts nothing about the one thing these rules exist to decide. */
const sheet = stylesheet('../Source/Design/Components/Banner/Banner.module.css');

/** Both spans in one rule, since they are truncated the same way. */
const truncating = /\.Text\s*,\s*\.Value\s*\{([^}]*)\}/;

/** The value's own rule, which is the one after the shared truncation rule rather than the
 * `.Value` inside it: the two spellings differ only by what precedes the selector, so the rule
 * is matched after a brace to keep the shared rule from answering for it. */
const value = /\}\s*\.Value\s*\{([^}]*)\}/;

/** The mark's own rule, matched the same way. */
const icon = /\}\s*\.Icon\s*\{([^}]*)\}/;

describe('the words and the value in a banner', () => {
  it('lets them shrink below their own content, or a long note widens the banner', () => {
    // A flex item's floor is its content width unless told otherwise, so a long wording
    // refuses to shrink and takes the row past the frame it is in. `min-width: 0` is the
    // whole difference between an ellipsis and an overflow.
    expect(sheet.ruleBody(truncating)).toContain('min-width:0');
  });

  it('clips what will not fit, since an ellipsis has nothing to sit in otherwise', () => {
    expect(sheet.declaration(truncating, 'overflow')).toBe('hidden');
  });

  it('keeps them on one line, because the ellipsis replaces an end and not a second row', () => {
    // Wrapped text has no end to cut at; `nowrap` is what makes the clip read as a cut.
    expect(sheet.declaration(truncating, 'white-space')).toBe('nowrap');
  });

  it('marks the cut with an ellipsis rather than stopping mid-word', () => {
    expect(sheet.declaration(truncating, 'text-overflow')).toBe('ellipsis');
  });

  it('truncates the value on the same rule, so a long one cannot push it out', () => {
    // The value is the shortest thing in the row and was left to wrap first, but a room name
    // or a score long enough to matter pushes just as hard as a long sentence does.
    expect(sheet.text).toMatch(/\.Text\s*,\s*\.Value\s*\{/);
  });

  it('leaves the value at the far end of the row', () => {
    // The value sits opposite the words and the words take the space between, which is the
    // one thing truncation must not cost.
    expect(sheet.declaration(value, 'margin-left')).toBe('auto');
  });

  it('holds the mark still while the words shrink around it', () => {
    // The mark is the one part of the row that must not be the thing that gets cut, so it is
    // held at full width while the text takes the loss.
    expect(sheet.declaration(icon, 'flex-shrink')).toBe('0');
  });
});

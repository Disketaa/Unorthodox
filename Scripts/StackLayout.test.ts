import { describe, it, expect } from 'vitest';
import { stylesheet } from './Stylesheet';

/**
 * The row that fills itself, read from the stylesheet.
 *
 * Out here rather than beside the component for the reason `ScreenLayout.test.ts` is:
 * it reads a file with `node:fs`, and widening the app's TypeScript `types` to allow
 * that would let browser code import Node built-ins.
 *
 * And it reads the file rather than rendering the component, because this layout is
 * invisible to a test runner. happy-dom does not lay out a flex row, so a rendered
 * `Stack` asserts nothing about the one thing `fill` exists to decide.
 */
const sheet = stylesheet('../Source/Design/Primitives/Stack/Stack.module.css');
const fillRule = /\.FillEven\s*>\s*\*\s*\{([^}]*)\}/;

describe('the row that fills itself', () => {
  it('grows its children rather than centring them', () => {
    // The whole of the ask. `justify-content` was the first attempt and it can only
    // move children inside a row they do not fill, so the pair sat in the middle of the
    // card at the width of their own words and the rest of the card stayed empty.
    // Widening the children is what puts that space inside the buttons.
    expect(sheet.declares(fillRule, 'flex')).toBe(true);
  });

  it('divides the row equally rather than by the width of each word', () => {
    // A `0` basis is the difference between equal shares and shares in proportion to
    // content. Left at `auto`, "Быстро" keeps a narrower button than "Обычно" and the
    // pair stops reading as a pair.
    expect(sheet.ruleBody(fillRule)).toContain('flex:110');
  });

  it('lets a child shrink below its own content, or it pushes the row too wide', () => {
    // A flex item's floor is its content unless told otherwise, so one long word would
    // refuse to shrink and take the row past the frame it is in.
    expect(sheet.ruleBody(fillRule)).toContain('min-width:0');
  });

  it('leaves every other row at the width of what is in it', () => {
    // The default has to be a row of its own contents, or every Stack in the app
    // changes with this one.
    expect(sheet.text).not.toContain('.FillContent');
  });

  it('leaves align and justify to mean what they mean', () => {
    // Two axes on one primitive, and they answer two different questions. Folding the
    // fill into either of them is what made this a second, contradictory property.
    expect(sheet.ruleBody(/\.JustifyCenter\s*\{([^}]*)\}/)).toContain('justify-content:center');
    expect(sheet.ruleBody(/\.AlignStretch\s*\{([^}]*)\}/)).toContain('align-items:stretch');
    expect(sheet.declares(fillRule, 'justify-content')).toBe(false);
  });
});

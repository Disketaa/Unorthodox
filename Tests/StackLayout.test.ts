import { describe, it, expect } from 'vitest';
import { stylesheet } from './Stylesheet';

/** The row that fills itself, read from the stylesheet. Out here rather than beside the
 * component for the reason `ScreenLayout.test.ts` is: it reads a file with `node:fs`, and
 * widening the app's TypeScript `types` to allow that would let browser code import Node
 * built-ins. And it reads the file rather than rendering the component, because this layout is
 * invisible to a test runner. happy-dom does not lay out a flex row, so a rendered `Stack`
 * asserts nothing about the one thing `fill` exists to decide. */
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

  it('grows into the room its parent has left, and gives it back rather than overflowing it', () => {
    // `Screen` answers this for a whole page of containers; a row inside a page needs it
    // too, or a child that centres itself below a sibling has no space to be given.
    //
    // Shrinkable, at `0`, because a flex item's floor is its own contents: a bank of six cards
    // stacked one per row is taller than the room on a phone, and a row that cannot shrink
    // grows past the viewport instead, so the page scrolls and half the themes are below the
    // fold. Shrinking is the whole of what stops that, and it only works with `min-height: 0`.
    const grow = sheet.ruleBody(/\.Grow\s*\{([^}]*)\}/);
    expect(grow).toContain('flex:11auto');
    expect(grow).toContain('min-height:0');
  });

  it('leaves every other row at the height of what is in it', () => {
    // The default has to stay a row of its own contents, or every Stack in the app grows
    // to fill whatever it is dropped into.
    expect(sheet.text).not.toContain('.NotGrow');
    expect(sheet.declares(/\.Root\s*\{([^}]*)\}/, 'flex')).toBe(false);
  });

  it('leaves align and justify to mean what they mean', () => {
    // Two axes on one primitive, and they answer two different questions. Folding the
    // fill into either of them is what made this a second, contradictory property.
    expect(sheet.ruleBody(/\.JustifyCenter\s*\{([^}]*)\}/)).toContain('justify-content:center');
    expect(sheet.ruleBody(/\.AlignStretch\s*\{([^}]*)\}/)).toContain('align-items:stretch');
    expect(sheet.declares(fillRule, 'justify-content')).toBe(false);
  });
});

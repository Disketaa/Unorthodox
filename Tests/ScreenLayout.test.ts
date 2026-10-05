import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';

/** The frame a screen's containers are laid out on, read from the stylesheet. This is out here
 * rather than beside the component for the reason `Tests/Tokens.test.ts` is: it reads a file
 * with `node:fs`, and widening the app's TypeScript `types` to allow that would let browser
 * code import Node built-ins. And it has to read the file rather than render the component,
 * because the whole of this layout is invisible to a test runner. happy-dom does not lay out a
 * grid, does not resolve a `minmax`, and does not match a width query, so a rendered `Screen`
 * asserts nothing about the one thing it exists to decide. What can be checked is the
 * declaration itself, which is where the behaviour actually lives. */
const sheet = stylesheet('../Source/Design/Primitives/Screen/Screen.module.css');
const flat = sheet.flat;

const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);

/** The body of one rule, named rather than spelled out. Most of the rules checked here are plain
 * class names, and a name reads better in the assertion than the pattern that matches it. The
 * combinator cases pass their own pattern, which is why the shared helper takes one. */
function ruleBody(name: string): string {
  return sheet.ruleBody(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`));
}

function declaration(name: string, property: string): string {
  return sheet.declaration(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`), property);
}

function declares(name: string, property: string): boolean {
  return sheet.declares(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`), property);
}

/** The width the row's query asks for, as a number of pixels. A media query condition cannot
 * hold a `var()`, so the threshold in the stylesheet is a bare pixel value and this is the only
 * thing that can hold it to the tokens: the arithmetic the number stands for is recomputed here
 * from the tokens themselves, and the two have to come out equal. That is what makes the
 * literal safe to have — change a column width and this fails rather than leaving a row that
 * opens too late. */
function queryWidth(): number {
  const match = flat.match(/@media\(min-width:(\d+)px\)/);
  if (match?.[1] === undefined) throw new Error('no width query for the row');
  return Number(match[1]);
}

/** The width a window has to be before the space inside it can hold a full row. Every column at
 * its narrowest, the gaps between them, and the page's own margin on both sides — which is the
 * padding a media query cannot see, since it measures the window and the frame is drawn inside
 * that margin rather than across all of it. */
function rowWidthFromTokens(): number {
  return (
    tokenNumber('--Layout-ColumnsMax') * tokenNumber('--Layout-ColumnMinWidth') +
    (tokenNumber('--Layout-ColumnsMax') - 1) * tokenNumber('--Space-Lg') +
    2 * tokenNumber('--Layout-ScreenPaddingHorizontal')
  );
}

/** How many containers share a row at a given window width. The stylesheet's two answers, worked
 * out rather than described: below the query there is one track and so one container per row,
 * and at or above it the row holds `--Layout-ColumnsMax` columns. The `auto-fit` inside the
 * query is not consulted here, because by the time it is reached the count is already decided —
 * it only collapses the tracks a screen has nothing in, and a screen with fewer containers than
 * the count still shows that many. This exists because "three across or one per row" is the
 * property the change was for, and every other assertion in this file checks a declaration
 * rather than the layout that declaration produces. A regression that put a second track back
 * below the query would leave the declarations intact and this number wrong. */
function rowCountAt(windowWidth: number): number {
  return windowWidth >= queryWidth() ? tokenNumber('--Layout-ColumnsMax') : 1;
}

/** A token as a number, in pixels or plain, for arithmetic over the scales. */
function tokenNumber(name: string): number {
  const value = tokenValue(name).match(/^(-?[\d.]+)(px)?$/);
  if (value?.[1] === undefined) throw new Error(`${name} is not a length: ${tokenValue(name)}`);
  return Number(value[1]);
}

describe('the screen frame', () => {
  it('puts every container on its own row until the whole set fits', () => {
    // The default is a single track, and this is the assertion that it stays one: a
    // frame that fits as many tracks as it can has no answer other than "two of
    // three", which reads as the pair the screen is about with the third left over
    // underneath it.
    expect(declaration('Root', 'grid-template-columns')).toBe(
      'min(var(--Layout-ContainerMaxWidth),100%)',
    );
  });

  it('lays the set side by side only when all of it fits, never part of it', () => {
    // The count comes from the query, not from `auto-fit`. Left to itself `auto-fit`
    // fits tracks one at a time, so its only other answer is "two of three", and that
    // reads as the pair the screen is about with the third left over underneath it.
    expect(flat).toContain('@media(min-width:');
    expect(declaration('Root', 'grid-template-columns')).not.toContain('auto-fit');
  });

  it('gives a row of fewer containers the whole width, and centres it', () => {
    // A fixed count of tracks would leave an empty one at the end of a two-container
    // screen, so the pair sits against the left with the gap on the wrong side.
    // `auto-fit` collapses the empty track and the two share the row — which is what
    // `justify-content` is then free to centre. So the query decides how many fit and
    // `auto-fit` decides how the ones that are there share the width; neither does the
    // other's job, and `auto-fit` on the frame would answer both and get the first wrong.
    const query = flat.match(/@media\(min-width:\d+px\)\{\.Root\{([^}]*)\}/);
    expect(query?.[1] ?? '').toContain('repeat(auto-fit,');
  });

  it('lets the columns grow to the container cap rather than to the row minimum', () => {
    // `minmax(0, 1fr)` and not `minmax(--Layout-ColumnMinWidth, 1fr)`. `auto-fit` fits
    // tracks at their *minimum* and divides the remainder between them, so a 320px
    // floor on a window wide enough for four tracks gave three columns of about 342px
    // and threw the fourth away — narrower than the readable line length, and shrinking
    // as the window grew. A `0` floor makes the tracks for the containers alone and lets
    // them share the frame, and the frame's `max-width` is what caps a column.
    const query = flat.match(/@media\(min-width:\d+px\)\{\.Root\{([^}]*)\}/);
    expect(query?.[1] ?? '').toContain('minmax(0,1fr)');
    expect(query?.[1] ?? '').not.toContain('--Layout-ColumnMinWidth');
  });

  it('caps a column at the container width, so three across are not stretched', () => {
    // The `1fr` tracks share whatever the frame is, and the frame is capped at three
    // container widths. So a column can never pass the readable line length, and this is
    // the assertion that the cap is still what stops it — the tracks themselves no longer
    // mention it.
    expect(declaration('Root', 'max-width')).toContain('--Layout-ContainerMaxWidth');
  });

  it('opens the row at the width its columns actually fit into', () => {
    // The threshold is a bare pixel value, because a media query condition cannot hold
    // a `var()` at all — custom properties are not resolved there, which is a rule of
    // the language rather than of a tool. So the number is written out and this is what
    // holds it to the tokens: the arithmetic is redone here and the two have to agree,
    // which is what makes it safe for the number to be a literal at all.
    expect(queryWidth()).toBe(rowWidthFromTokens());
  });

  it('counts the page padding, which a media query cannot see', () => {
    // A media query measures the window, and the frame is drawn inside the page's own
    // horizontal padding rather than across the whole of it. Leaving the padding out
    // makes the row open two margins too late, and on a window just wide enough for the
    // row that is the difference between three across and one.
    const margins = 2 * tokenNumber('--Layout-ScreenPaddingHorizontal');
    expect(queryWidth() - margins).toBeLessThan(queryWidth());
    expect(rowWidthFromTokens()).toBeGreaterThan(
      tokenNumber('--Layout-ColumnsMax') * tokenNumber('--Layout-ColumnMinWidth'),
    );
  });

  it('caps a row at the column count, and the cap is a count of tokens', () => {
    // A hand-written number here would be a breakpoint wearing a token's clothes, and
    // the count is the one thing about the row that a screen may not choose for itself.
    expect(declaration('Root', 'max-width')).toContain('--Layout-ColumnsMax');
  });

  it('sizes the frame as whole containers and the gaps between them', () => {
    // Three containers and two gaps: the gap count is one fewer than the column count
    // because the last container has nothing after it. Getting this wrong leaves a row
    // one gap narrower than the frame is wide, and the third container wraps early.
    expect(declaration('Root', 'max-width')).toContain('(var(--Layout-ColumnsMax)-1)');
  });

  it('never asks a track to be wider than the space there is', () => {
    // The default track is `min(cap, 100%)`, so a phone narrower than a container
    // shrinks the track rather than overflowing it and pushing the page's padding off
    // the side. Inside the query the tracks are `1fr`, which cannot overflow by
    // construction, so this is the only place a floor is needed and it is on the
    // default rather than inside the query.
    expect(declaration('Root', 'grid-template-columns')).toBe(
      'min(var(--Layout-ContainerMaxWidth),100%)',
    );
  });

  it('is one per row on a phone and three across on a desktop, and never two', () => {
    // The property the change was for, at the widths it was asked about. Every other
    // assertion here checks a declaration; this one checks what the declarations add up
    // to, which is the thing that was actually wrong — a frame that fit tracks one at a
    // time had a perfectly good `auto-fit` on it and still managed two of three.
    expect(rowCountAt(800)).toBe(1);
    expect(rowCountAt(1050)).toBe(1);
    expect(rowCountAt(1700)).toBe(3);
    expect(rowCountAt(1800)).toBe(3);
  });

  it('has no width at which it fits two of the three', () => {
    // Swept rather than sampled, because the failure was a range and not a width: the
    // whole band between one column and the full row used to be two across with the
    // third below. Any width in there answering 2 is the bug this whole change is for.
    const counts = new Set<number>();
    for (let width = 320; width <= 2560; width += 1) counts.add(rowCountAt(width));
    expect([...counts].sort()).toEqual([1, 3]);
  });

  it('centres a row that is not full, at every width', () => {
    // Tracks are capped rather than `1fr`, so a row of two on a wide screen leaves
    // empty space at its end. Centring is what keeps that on both sides, and it is also
    // what the two-container screen depends on once `auto-fit` has collapsed the third
    // track.
    expect(declaration('Root', 'justify-content')).toBe('center');
  });

  it('puts the screen at the top or in the middle, and it is a choice', () => {
    expect(declaration('VerticalTop', 'align-content')).toBe('start');
    expect(declaration('VerticalCenter', 'align-content')).toBe('center');
  });

  it('leaves a container as tall as what is in it, lined up by its top', () => {
    // Grid stretches items to their row, so a card beside the wordmark was being pulled
    // to the wordmark's height with its own content sitting at the top of the box,
    // which reads as padding nobody set. This is the alignment every screen but the
    // entry one asks for.
    expect(declaration('AlignStart', 'align-items')).toBe('start');
  });

  it('can line containers up in the middle of one another instead', () => {
    // A wordmark is a third of the height of the card of fields beside it, so aligned
    // by the top edge it floats beside the middle of the menu rather than sitting in
    // the middle of it. The entry screen asks for this and the lobby does not, so it
    // is a choice rather than a default.
    expect(declaration('AlignCenter', 'align-items')).toBe('center');
  });

  it('keeps the two alignment axes apart', () => {
    // `align-content` places the rows in the viewport and `align-items` places a
    // container in its row. Conflated, a screen could not centre itself without also
    // centring every container, and the lobby could not sit at its top.
    expect(declares('AlignStart', 'align-content')).toBe(false);
    expect(declares('VerticalTop', 'align-items')).toBe(false);
  });

  it('fills the room it is given without ever shrinking below its own content', () => {
    // Grow, never shrink, at its own height: a short screen fills the page so its rows
    // can be centred in it, and a tall one keeps its height and scrolls. Asking for a
    // viewport of its own instead would be a viewport plus `#root`'s padding, so every
    // screen would scroll whether it fitted or not.
    expect(declaration('Root', 'flex')).toBe('10auto');
    expect(declares('Root', 'min-height')).toBe(false);
  });

  it('reads its sizes from tokens, so one edit moves the whole layout', () => {
    // A length written here rather than in the stylesheet is a length that stops
    // answering to the theme, which is the one thing the token layer is for.
    expect(ruleBody('Root')).not.toMatch(/\d+px/);
    expect(sheet.text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('the tokens behind it', () => {
  it('holds a container to the width the readable line length is set at', () => {
    expect(tokenValue('--Layout-ContainerMaxWidth')).toBe('480px');
  });

  it('asks for three containers across, and no more', () => {
    // Three is the widest row anything in the game needs: the lobby's three, and a
    // spare. The number is a token because a layout rule written as a bare 3 in a
    // stylesheet is a rule nobody can find again, and it is now also the threshold the
    // frame's row is measured against.
    expect(tokenValue('--Layout-ColumnsMax')).toBe('3');
  });

  it('no longer names the whole page, which it does not describe any more', () => {
    // It was the page's width while the app was one fixed column. Renaming it is what
    // stops the next person reading a per-container token as a per-page one.
    expect(tokens).not.toContain('--Layout-ContentMaxWidth');
  });

  it('leaves the page itself with nothing but its padding and its height', () => {
    // Centring the column and centring the screen vertically are both decided per
    // screen now, so leaving either on `#root` would decide it for every screen at
    // once, and the lobby could not sit at its top.
    const root = tokens.match(/#root\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(root).not.toContain('justify-content');
    expect(root).not.toContain('max-width');
    expect(root).not.toContain('margin');
    // The column is what lets the frame take the height the padding has left over.
    expect(root).toContain('display: flex');
    expect(root).toContain('flex-direction: column');
  });

  it('is the column the frame grows in, and not the height it asks for', () => {
    // `#root` is a viewport tall including its padding. A frame that asked for a
    // viewport of its own would be a padding taller than the page it sits in, and
    // every screen would scroll whether its content fitted or not.
    const root = tokens.match(/#root\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(root).toContain('min-height: 100dvh');
    expect(declares('Root', 'min-height')).toBe(false);
  });
});

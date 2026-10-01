import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * The frame a screen's containers are laid out on, read from the stylesheet.
 *
 * This is out here rather than beside the component for the reason
 * `Scripts/Tokens.test.ts` is: it reads a file with `node:fs`, and widening the app's
 * TypeScript `types` to allow that would let browser code import Node built-ins.
 *
 * And it has to read the file rather than render the component, because the whole of
 * this layout is invisible to a test runner. happy-dom does not lay out a grid, does
 * not resolve a `minmax`, and does not match a width query, so a rendered `Screen`
 * asserts nothing about the one thing it exists to decide. What can be checked is the
 * declaration itself, which is where the behaviour actually lives.
 */
/**
 * The stylesheet with its comments taken out.
 *
 * A declaration can follow a comment rather than another declaration, and this file
 * explains most of itself, so parsing the text as written would treat the end of a
 * comment as the end of a declaration and quietly skip the one after it.
 */
const css = readFileSync(
  new URL('../Source/Design/Primitives/Screen/Screen.module.css', import.meta.url),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);

/** The body of one class, without the braces. */
function ruleBody(selector: string): string {
  const match = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`));
  if (match?.[1] === undefined) throw new Error(`no rule for .${selector}`);
  return match[1];
}

/**
 * One declaration out of a rule body, with its spaces gone.
 *
 * Prettier wraps a long `calc()` across lines and puts spaces inside the parentheses
 * it breaks, so a declaration read verbatim is broken up in ways that have nothing to
 * do with what it says. Comparing without whitespace asks the question instead of
 * asking about the formatting.
 */
function declaration(selector: string, property: string): string {
  const match = ruleBody(selector).match(new RegExp(`(?:^|;)\\s*${property}\\s*:([^;]+);`, 'i'));
  if (match?.[1] === undefined) {
    throw new Error(`no ${property} on .${selector}`);
  }
  return match[1].replace(/\s+/g, '');
}

/** Whether a rule sets a property at all, matched whole so `height` is not `min-height`. */
function declares(selector: string, property: string): boolean {
  return new RegExp(`(?:^|;)\\s*${property}\\s*:`, 'i').test(ruleBody(selector));
}

/** The value a token resolves to, following a `var()` to whatever it points at. */
function tokenValue(name: string, depth = 0): string {
  const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`, 'i'));
  if (match?.[1] === undefined) throw new Error(`no token found for ${name}`);
  const reference = match[1].trim().match(/^var\((--[a-z-]+)\)$/i);
  if (reference?.[1] === undefined) return match[1].trim();
  if (depth > 4) throw new Error(`var() chain too deep at ${name}`);
  return tokenValue(reference[1], depth + 1);
}

describe('the screen frame', () => {
  it('lets the direction come from the width rather than from the caller', () => {
    // `auto-fit` is the whole mechanism: it fits as many tracks as there is room for
    // and wraps the rest. A `repeat` with a fixed count would be a direction the
    // stylesheet decided, and a screen written against it would be a screen that has
    // to be written twice.
    expect(declaration('Root', 'grid-template-columns')).toContain('auto-fit');
  });

  it('caps a row at the column count without a width query', () => {
    // The cap is the frame's own width rather than a breakpoint, so this is the
    // assertion that there is no breakpoint to disagree with it later.
    const maxWidth = declaration('Root', 'max-width');
    expect(maxWidth).toContain('--Layout-ColumnsMax');
    expect(css).not.toContain('@media');
    expect(css).not.toContain('@container');
  });

  it('sizes the frame as whole containers and the gaps between them', () => {
    // Three containers and two gaps: the gap count is one fewer than the column count
    // because the last container has nothing after it. Getting this wrong leaves a row
    // one gap narrower than the frame is wide, and the third container wraps early.
    expect(declaration('Root', 'max-width')).toContain('(var(--Layout-ColumnsMax)-1)');
  });

  it('keeps a track from being wider than the space there is', () => {
    // Without the `min()` a `minmax` floor above the available width resolves to the
    // floor and overflows it, which on a phone narrower than a container would push
    // the padding off the side of the page.
    expect(declaration('Root', 'grid-template-columns')).toContain(
      'min(var(--Layout-ContainerMaxWidth),100%)',
    );
  });

  it('centres a row that is not full, at every width', () => {
    // Tracks are a fixed width rather than `1fr`, so a row of two on a wide screen
    // leaves empty space at its end. Centring is what keeps that on both sides.
    expect(declaration('Root', 'justify-content')).toBe('center');
  });

  it('puts the screen at the top or in the middle, and it is a choice', () => {
    expect(declaration('VerticalTop', 'align-content')).toBe('start');
    expect(declaration('VerticalCenter', 'align-content')).toBe('center');
  });

  it('leaves a container as tall as what is in it', () => {
    // Grid stretches items to their row, so a card beside the wordmark was being pulled
    // to the wordmark's height with its own content sitting at the top of the box,
    // which reads as padding nobody set.
    expect(declaration('Root', 'align-items')).toBe('start');
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
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('the tokens behind it', () => {
  it('holds a container to the width the readable line length is set at', () => {
    expect(tokenValue('--Layout-ContainerMaxWidth')).toBe('480px');
  });

  it('asks for three containers across, and no more', () => {
    // Three is the widest row anything in the game needs: the lobby's two, and a
    // spare. The number is a token because a layout rule written as a bare 3 in a
    // stylesheet is a rule nobody can find again.
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
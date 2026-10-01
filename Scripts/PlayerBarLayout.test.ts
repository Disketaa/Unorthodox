import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';
import { GameConfig } from '../Source/Game';
import { FallbackSlots } from '../Source/Design/Components/PlayerBar/SlotLimit';

/**
 * The bar across the top of a game, read from the stylesheet.
 *
 * Out here for the reason `Scripts/ScreenLayout.test.ts` is: it reads a file with
 * `node:fs`, and happy-dom does not lay out a flex row or match a width query, so a
 * rendered `PlayerBar` says nothing about the wrapping and the sizing.
 */
const sheet = stylesheet('../Source/Design/Components/PlayerBar/PlayerBar.module.css');

const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);

function declaration(name: string, property: string): string {
  return sheet.declaration(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`), property);
}

function ruleBody(name: string): string {
  return sheet.ruleBody(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`));
}

describe('the bar of players', () => {
  it('wraps onto a second row rather than scrolling, so nobody is behind a swipe', () => {
    expect(declaration('Root', 'flex-wrap')).toBe('wrap');
    expect(declaration('Root', 'display')).toBe('flex');
    expect(sheet.flat).not.toContain('overflow-x');
  });

  it('gives every slot the same width, so the characters line up across the bar', () => {
    // A slot sized by its own name would make the row ragged and the faces hop about
    // as players arrive.
    expect(declaration('Slot', 'width')).toBe('var(--Size-PlayerBarSlot)');
    expect(sheet.flat).not.toContain('max-content');
  });

  it('reads its sizes from tokens, so one edit moves the whole bar', () => {
    expect(ruleBody('Root')).not.toMatch(/\d+px/);
    expect(sheet.text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('marks the local player with the accent wash, as the accent banner does', () => {
    expect(declaration('Self', 'background')).toBe('var(--Accent-Wash)');
    // The border is on the slot's own edge and transparent at rest, so marking yourself
    // does not resize the bar.
    expect(declaration('Slot', 'border')).toContain('solid');
    expect(declaration('Slot', 'border')).toContain('transparent');
  });

  it('leaves every slot transparent, so the bar is a row and not a strip of cards', () => {
    expect(declaration('Slot', 'background')).toBe('transparent');
  });

  it('holds a dropped player back rather than removing them from the bar', () => {
    // The same half opacity the lobby's own chip uses, so a player who left reads the
    // same way wherever they are drawn. One declaration on the slot as a whole, so the
    // face, the name and the score go quiet together rather than one at a time.
    expect(declaration('Offline', 'opacity')).toBe('0.5');
    expect(sheet.declares(/\.Offline\s*\{([^}]*)\}/, 'background')).toBe(false);
    expect(sheet.declares(/\.Offline\s*\{([^}]*)\}/, 'display')).toBe(false);
  });

  it('scores its players in the room yellow, which is the same to everyone', () => {
    expect(declaration('Score', 'color')).toBe('var(--Color-Room-Yellow)');
  });

  it('has no border of its own around the row', () => {
    // A frame here would put the game's own content inside a card.
    expect(sheet.ruleBody(/^\.Root\s*\{([^}]*)\}/m)[1]).not.toContain('border');
  });
});

it('draws the host crown out of the flow, so the host is not the tallest slot', () => {
    // In the flow it would push the host's name and score down a line and break the row of
    // faces, which is the one thing the bar is for.
    expect(declaration('Crown', 'position')).toBe('absolute');
    expect(declaration('Slot', 'position')).toBe('relative');
  });

it('centres the crown on the character and lifts it onto the slot edge', () => {
    expect(declaration('Crown', 'left')).toBe('50%');
    // `translate` and not `transform`: the sway animates `transform` on this same node,
    // so the centring has to be the property that composes with it rather than the one it
    // would be written over.
    expect(declaration('Crown', 'translate')).toBe('-50%-50%');
    // No fill of its own: a box behind it would read as a chip in a bar of slots rather
    // than as a mark on one.
    expect(sheet.declares(/\.Crown\s*\{([^}]*)\}/, 'background')).toBe(false);
  });

it('rocks the crown on the same movement as the characters', () => {
    // Composed from the shared primitive rather than given keyframes of its own: two
    // copies of the sway would be one movement that had quietly forked.
    expect(ruleBody('Crown')).toContain('Sway.module.css');
  });

it('crowns the host in the room yellow, like the lobby and the Start button', () => {
    expect(declaration('Crown', 'color')).toBe('var(--Color-Room-Yellow)');
    expect(ruleBody('CrownIcon')).toContain('Crown.svg');
  });

describe('the tokens behind it', () => {
  it('holds sixteen players, and says so as a count rather than a length', () => {
    // A count, because the bar drops a player past it in render, which is a decision a
    // stylesheet cannot make.
    expect(tokenValue('--Layout-PlayerBarSlots')).toBe('16');
  });

  it('holds exactly what a room holds, so nobody is ever drawn and nobody left out', () => {
    // The same number as `GameConfig.limits.maxPlayers`, and a token rather than a copy
    // of that value because Design may not read Game — which is what makes the test the
    // only thing keeping the two together.
    expect(tokenValue('--Layout-PlayerBarSlots')).toBe(String(GameConfig.limits.maxPlayers));
  });

  it('falls back to the same number it declares, so a page without tokens still has a bar', () => {
    // The fallback is a second copy of the number and the only one that can be wrong
    // quietly, since a page that has not loaded `Tokens.css` reads the copy rather than
    // the token.
    expect(FallbackSlots).toBe(Number(tokenValue('--Layout-PlayerBarSlots')));
  });

  it('sizes a slot wide enough for a short name and a two-digit score', () => {
    const slot = Number(tokenValue('--Size-PlayerBarSlot').replace('px', ''));
    const character = Number(tokenValue('--Size-Character-Small').replace('px', ''));
    expect(slot).toBeGreaterThan(character);
  });
});
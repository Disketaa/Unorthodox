import { describe, it, expect } from 'vitest';
import { stylesheet } from './Stylesheet';

/** The card of this browser's own seat, read from the stylesheet. Out here for the reason
 * `Tests/ScreenLayout.test.ts` is: it reads a file with `node:fs`, and happy-dom does not lay
 * out a flex column or match a clamp, so a rendered `PlayerCard` says nothing about the sizing. */
const sheet = stylesheet('../Source/Design/Components/PlayerCard/PlayerCard.module.css');

function declaration(name: string, property: string): string {
  return sheet.declaration(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`), property);
}

describe('the card of this player', () => {
  it('is one card and not a row of them', () => {
    // The roster it replaced was a wrapping flex row sized for eight seats to a line, and every
    // one of its answers — the width, the two rows, the collapse below a certain screen — were
    // answers about how many players were in the room. One card has none of them.
    expect(sheet.text).not.toContain('flex-wrap');
    expect(declaration('Root', 'flex-direction')).toBe('row');
    expect(sheet.text).not.toContain('@media');
  });

  it('is a plank along the top of the game rather than a square', () => {
    // The words run down the left and the face stands at the end of them, in one row: a card
    // that stacked its three things took a square's worth of the top of a screen that is sharing
    // it with the bank of theme cards. Narrow, so it is a strip and not a panel — the face and a
    // figure are most of what it is, and a name longer than that is cut rather than wrapped.
    expect(declaration('Root', 'align-items')).toBe('center');
    expect(declaration('Root', 'justify-content')).toBe('space-between');
    expect(declaration('Root', 'padding')).toBe('var(--Space-Sm)var(--Space-Md)');
    // One block of words and one block of drawing, rather than three children that could each
    // land anywhere in the row.
    expect(declaration('Details', 'flex-direction')).toBe('column');
    expect(declaration('Details', 'align-items')).toBe('flex-start');
    // Everything is read from the left edge, which is what the arrangement is for.
    expect(declaration('NameRow', 'justify-content')).toBe('flex-start');
    expect(declaration('Name', 'text-align')).toBe('left');
    expect(declaration('Score', 'text-align')).toBe('left');
  });

  it('is a card in the middle of the top of the game rather than a band across it', () => {
    // Hugged rather than stretched across the row it stands in, and centred rather than hung off
    // one edge: a card against the edge of the screen looks like it was put there rather than part
    // of the arrangement it sits in. Capped as well, so the strip does not become a panel.
    expect(declaration('Root', 'align-self')).toBe('center');
    expect(declaration('Root', 'justify-self')).toBe('center');
    expect(declaration('Root', 'width')).toBe('var(--Size-PlayerCardWidth)');
    expect(declaration('Root', 'max-width')).toBe('100%');
    expect(declaration('Root', 'background')).toBe('var(--Accent-Wash)');
    expect(declaration('Root', 'border-radius')).toBe('var(--Radius-Card)');
    // And the border stays transparent at rest, so nothing about the card resizes as it is
    // filled in.
    expect(declaration('Root', 'border')).toContain('transparent');
  });

  it('draws its face at the end of the row, and no taller than the words beside it', () => {
    // The last child rather than the first, which is where the row puts it: the size
    // `Character` gives itself is the size the picker and the scoreboard use, and this face is
    // read from further away than either of them is — but only as far as the strip allows.
    const face = sheet.ruleBody(/\.Root\s*>\s*:last-child\s*\{([^}]*)\}/);
    expect(face).toContain('width:var(--Size-PlayerCardCharacter)');
    expect(face).toContain('height:var(--Size-PlayerCardCharacter)');
    // Not a drawing that can be squeezed along the strip when the name is long: the name is cut
    // first, since it is the thing that can be.
    expect(face).toContain('flex:none');
  });

  it('reads its sizes from tokens, so one edit moves the whole card', () => {
    expect(sheet.text).not.toMatch(/\d+px/);
    expect(sheet.text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(sheet.text).not.toContain('max-content');
  });

  it('cuts a long name rather than wrapping it, so the card keeps its height', () => {
    expect(sheet.text).toContain('composes: Truncate from');
    expect(declaration('NameRow', 'min-width')).toBe('0');
    expect(declaration('Name', 'font-size')).toBe('var(--FontSize-PlayerCardName)');
  });

  it('writes the standing a step above the name, in the room\'s own yellow', () => {
    // Two steps up, because the score is what the card is for: the name says who is looking at
    // it and the figure says where they stand. Fixed gold, not the viewer's accent — this is the
    // room's running figure, and a number that changed colour with whoever read it would say the
    // same figure meant different things to different players.
    expect(declaration('Score', 'color')).toBe('var(--Color-Room-Yellow)');
    expect(declaration('Score', 'font-size')).toBe('var(--FontSize-PlayerCardScore)');
    expect(declaration('Score', 'font-variant-numeric')).toBe('tabular-nums');
    expect(declaration('Score', 'line-height')).toBe('var(--Size-PlayerCardLine)');
  });

  it('puts the crown on the name\'s line, where it is inside the card and adds no height', () => {
    expect(sheet.declares(/\.Crown\s*\{([^}]*)\}/, 'position')).toBe(false);
    expect(sheet.declares(/\.Crown\s*\{([^}]*)\}/, 'top')).toBe(false);
    expect(sheet.declares(/\.Crown\s*\{([^}]*)\}/, 'background')).toBe(false);
    expect(declaration('Crown', 'color')).toBe('var(--Color-Room-Yellow)');
    expect(sheet.ruleBody(/\.CrownIcon\s*\{([^}]*)\}/)).toContain('Crown.svg');
  });

  it('holds a dropped player back at the same amount the lobby\'s chip does', () => {
    expect(declaration('Offline', 'opacity')).toBe('0.5');
    expect(sheet.declares(/\.Offline\s*\{([^}]*)\}/, 'background')).toBe(false);
  });
});

export {};

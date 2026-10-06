import { describe, it, expect } from 'vitest';
import { stylesheet, tokenReader } from './Stylesheet';
import { readFileSync } from 'node:fs';
import { GameConfig } from '@/Game';
import { FallbackSlots } from '@/Design/Components/PlayerBar/SlotLimit';

/** The bar of hexes across the top of a game, read from the stylesheet. Out here for the reason
 * `Tests/ScreenLayout.test.ts` is: it reads a file with `node:fs`, and happy-dom lays out no
 * flex row and matches no `clip-path`, so a rendered `PlayerBar` says nothing about the sizing. */
const sheet = stylesheet('../Source/Design/Components/PlayerBar/PlayerBar.module.css');

const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenValue = tokenReader(tokens);

function declaration(name: string, property: string): string {
  return sheet.declaration(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`), property);
}

describe('the bar of hexes', () => {
  it('is one row, so nothing is ever behind a swipe or pushed onto a second line', () => {
    expect(declaration('Root', 'flex-wrap')).toBe('nowrap');
    expect(declaration('Root', 'display')).toBe('flex');
    expect(sheet.flat).not.toContain('overflow-x');
  });

  it('cuts its seats as hexagons, which a border radius cannot do', () => {
    // Eight points rather than four corners: the shape is what tells two seats apart in a row of
    // twelve, and it is the reason nothing inside a seat needs a frame of its own.
    expect(declaration('Slot', 'clip-path')).toContain('polygon');
    // Taller than wide, since a hexagon is; a square would be a rounded square again.
    expect(declaration('Slot', 'aspect-ratio')).toBe('1/1.1547');
  });

  it('chamfers the hexagon\'s corners in the polygon rather than through `round()`', () => {
    // A browser that will not parse `round()` discards the whole declaration with it, which leaves
    // the seat an uncut square: the shape has to survive in the points themselves. Twelve points
    // rather than six, two at each corner, and none of them a vertex.
    const points = declaration('Slot', 'clip-path').match(/%/g)?.length ?? 0;
    expect(points).toBe(24);
    expect(declaration('Slot', 'clip-path')).not.toContain('round');
  });

  it('keeps a thin seam between the seats, since tiling flat reads as one grey band', () => {
    // Two hexagons with nothing between them are one shape with a line drawn across it. Thin,
    // because the seam is a line rather than a gap: the tiling has to survive it.
    expect(tokenValue('--Space-PlayerBarSeam')).toBe('calc(var(--Size-PlayerBarSlot) * 0.06)');
    expect(declaration('Seat', 'margin-right')).toBe(
      'calc(var(--Offset-PlayerBarHoneycomb) + var(--Space-PlayerBarSeam))',
    );
  });

  it('sizes a seat from a token, so one edit moves the whole row', () => {
    expect(declaration('Slot', 'width')).toBe('var(--Size-PlayerBarSlot)');
    expect(sheet.text).not.toMatch(/\d+px/);
    expect(sheet.text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('holds the face off the sloped edges, or the hexagon reads as a square', () => {
    expect(declaration('Face', 'inset')).toBe('var(--Inset-PlayerBarFace)');
  });

  it('sets the name in one box width, whatever the name or the seat measures', () => {
    // One width rather than a cap or a shrink-to-fit, which is what makes the fade correct: a box
    // that fitted its contents would fade a short name's own last letters.
    expect(declaration('Label', 'width')).toBe('var(--Size-PlayerBarNameMax)');
    expect(sheet.declares(/\.Label\s*\{([^}]*)\}/, 'max-width')).toBe(false);
    expect(sheet.ruleBody(/\.Label\s*\{([^}]*)\}/)).not.toContain('min(');
  });

  it('clips a long unbroken name to that box instead of growing it', () => {
    // Two declarations, and both are load-bearing. An `auto` column is sized by the widest item's
    // max-content, so one long name widens the column; and a grid item's `min-width` is `auto`,
    // which resolves to min-content — for a name with no spaces that is the whole name, so the
    // item refuses to shrink and the fade never lands. A name of any length stays 48px.
    expect(declaration('Label', 'grid-template-columns')).toBe('minmax(0,1fr)');
    expect(sheet.ruleBody(/\.Score,\s*\.Name\s*\{([^}]*)\}/)).toContain('min-width:0');
    expect(declaration('Name', 'text-align')).toBe('center');
    expect(declaration('Score', 'text-align')).toBe('center');
  });

  it('fades the name out rather than cutting it with an ellipsis', () => {
    // Three dots after a name says the name is missing letters; a name running off under the
    // stroke says the same without spending four pixels of a forty-eight-pixel box on
    // punctuation. `mask-image` and not an opacity gradient, so the stroke fades with the glyph
    // instead of leaving a hard grey edge past the last letter. `min-width: 0` is what lets a
    // flex item shrink below its content at all — without it the name widens the label instead.
    expect(sheet.declares(/\.Name\s*\{([^}]*)\}/, 'text-overflow')).toBe(false);
    expect(declaration('Name', 'text-align')).toBe('center');
    // One fade, at the right. Two of them dims the start of every name including the ones that
    // fit, and a name reads as damaged rather than as continuing past its box.
    const fade = declaration('Name', 'mask-image');
    expect(fade).toContain('linear-gradient');
    expect(fade).toContain('currentColorcalc(100%-var(--Size-PlayerBarNameFade))');
    expect(fade.match(/var\(--Size-PlayerBarNameFade\)/g)).toHaveLength(1);
    expect(declaration('Name', 'overflow')).toBe('hidden');
    expect(declaration('Name', 'white-space')).toBe('nowrap');
    // No `min-width: 0` here: that is a flex item's floor, and these are grid items in a cell of
    // a fixed box, which overflow rather than grow.
    // Not composed from the shared primitive: that cuts with an ellipsis, which is what this
    // replaces, and the box has to be the label's width rather than shrink-to-fit.
    expect(sheet.ruleBody(/\.Name\s*\{([^}]*)\}/)).not.toContain('Truncate.module.css');
    expect(tokenValue('--Size-PlayerBarNameFade')).toBe('1.5em');
    // The cap, resolved: a name wider than the hexagon's flat top hangs off both sloping sides
    // and reads as a neighbour's.
    expect(tokenValue('--Size-PlayerBarNameMax')).toBe('48px');
  });

  it('strokes the name in the hexagon\'s own fill, and paints that stroke under the glyph', () => {
    // The name crosses the hexagon's top point, so plain text there is a word lying on a shape.
    // `paint-order: stroke fill` is the part that keeps it readable: the default paints fill then
    // stroke, and a stroke centred on the outline eats half the glyph — thin and grey at twelve
    // pixels. Painted first, only the outside half is left showing.
    expect(declaration('Name', '-webkit-text-stroke')).toContain('var(--Size-PlayerBarNameStroke)');
    expect(declaration('Name', 'paint-order')).toBe('strokefill');
    // Declared once on the seat and inherited, so the name and the score cannot end up cut against
    // different colours, and a state is one declaration rather than a rule per element.
    expect(declaration('Seat', '--Color-PlayerBarNameStroke')).toBe('var(--Color-Surface-Hover)');
    // The seat's fill and the hexagon's have to be the same colour for any of this to work.
    expect(declaration('Slot', 'background')).toBe('var(--Color-Surface-Hover)');
  });

  it('draws the name on top of the hexagon, out of the flow', () => {
    // On the seat rather than above it, so a name belongs to that seat instead of hanging over
    // the row. Out of the flow because in it the label is a second line, and every hexagon would
    // sit a name's height lower than the one beside it. Centred with `translate` rather than
    // `transform`, which the sway animates on a mark inside it.
    expect(declaration('Label', 'position')).toBe('absolute');
    expect(declaration('Label', 'top')).toBe('0');
    expect(declaration('Label', 'left')).toBe('50%');
    expect(declaration('Label', 'translate')).toBe('-50%0');
  });

  it('swaps the name for the score under the pointer, rather than adding a line', () => {
    // Both in one grid cell, so the label cannot change size: a seat that resized under the
    // pointer would end the very hover that is doing the swapping, and the row would jump.
    expect(declaration('Label', 'display')).toBe('grid');
    expect(sheet.ruleBody(/\.Score,\s*\.Name\s*\{([^}]*)\}/)).toContain('grid-area:1/1');
    // The swap hangs off the seat, not the label: hovering the label alone would flicker as the
    // name is replaced under the cursor.
    expect(sheet.ruleBody(/\.Seat:hover\s\.Name\s*\{([^}]*)\}/)).toContain('opacity:0');
    expect(sheet.ruleBody(/\.Seat:hover\s\.Score\s*\{([^}]*)\}/)).toContain('opacity:1');
    // Held at zero rather than removed, so a label walked without a pointer still reads it.
    expect(declaration('Score', 'opacity')).toBe('0');
  });

  it('draws the score in the primary yellow and bold, because a standing is a fact about the room', () => {
    // Not the accent: a score must not wear the reader's own tint, the same rule the crown and
    // the start button follow. Bold against the name's weight, so the score reads as the stronger
    // of the two rather than a quieter replacement. Same stroke as the name, so a number reads
    // against the hexagon the way a name does.
    expect(declaration('Score', 'color')).toBe('var(--Color-Action-Primary-Background)');
    expect(declaration('Score', 'font-weight')).toBe('700');
    expect(declaration('Score', '-webkit-text-stroke')).toContain(
      'var(--Size-PlayerBarNameStroke)',
    );
    expect(declaration('Score', 'paint-order')).toBe('strokefill');
  });

  it('washes the seat under the pointer in the room\'s yellow, matching the score\'s stroke', () => {
    // The same note the local player's own seat wears at rest, so "this one" reads the same
    // whether the pointer found a seat or the pointer is you. A fill outright would hide the
    // character the seat exists to show.
    // One colour for every seat: a red player and a green one wash the same yellow under the
    // pointer, so "hovered" reads as hovered rather than as that player's own tint. Mixed from the
    // room's yellow and not from `--Accent-Wash`, which is themed — a rose room would wash the
    // hovered seat rose and the hover would say nothing at all.
    expect(declaration('Seat', '--Color-PlayerBarHoverWash')).toContain(
      'color-mix(insrgb,var(--Color-Room-Yellow)25%',
    );
    expect(sheet.ruleBody(/\.Seat:hover\s*\{([^}]*)\}/)).toContain(
      '--Color-PlayerBarNameStroke:var(--Color-PlayerBarHoverWash)',
    );
    expect(sheet.ruleBody(/\.Seat:hover\s\.Slot\s*\{([^}]*)\}/)).toContain(
      'background:var(--Color-PlayerBarHoverWash)',
    );
    // The themed wash must not appear anywhere in a hover: it is what made a rose room wash rose.
    expect(sheet.text).not.toMatch(/:hover[^{]*\{[^}]*--Accent-Wash/);
    // On the resting rule, not the hover's: a transition declared only under `:hover` eases in
    // and snaps back out, which is the half of the movement nobody asked for.
    expect(declaration('Slot', 'transition')).toContain('background-color');
    expect(sheet.declares(/\.Seat:hover\s\.Slot\s*\{([^}]*)\}/, 'transition')).toBe(false);
  });

  it('washes the local player\'s seat in their own tint, since that is what is unmistakably theirs', () => {
    // The tint classes are composed in rather than declared again, so a seat's colour is the same
    // number the character inside it wears and a new tint is one line in one file.
    const seat = sheet.ruleBody(/\.Seat\s*\{([^}]*)\}/);
    for (const tint of ['Coral', 'Amber', 'Yellow', 'Lime', 'Mint', 'Sky', 'Violet', 'Rose']) {
      expect(seat).toContain(`${tint}from'../Character/Character.module.css'`);
    }
    // Derived rather than hand-picked: the character tokens are mid-tones and unreadable as a
    // seat fill, so they are washed a fifth of the way to white.
    expect(declaration('Seat', '--Color-PlayerBarSeatWash')).toContain(
      'color-mix(insrgb,var(--Character-Tint)20%',
    );
    expect(sheet.declaration(/\.Self\s*\{([^}]*)\}/, '--Color-PlayerBarNameStroke')).toBe(
      'var(--Color-PlayerBarSeatWash)',
    );
  });

  it('draws no crown, since the name already says who this is', () => {
    // A mark beside the name is a second thing to read in a row of twelve, and the host is simply
    // the first name in the room's own order — which is where the room puts them.
    expect(sheet.text).not.toMatch(/\.Crown\b/);
    expect(sheet.text).not.toContain('Crown.svg');
    expect(tokenReader(tokens)('--Color-Room-Yellow')).toBe('#eeb62e');
  });

  it('marks the local player with a wash of their own tint, since a ring inside a hexagon is a ring in a ring', () => {
    expect(declaration('Self .Slot', 'background')).toBe('var(--Color-PlayerBarSeatWash)');
  });

  it('holds a dropped player back rather than removing them from the bar', () => {
    expect(declaration('Offline', 'opacity')).toBe('0.5');
    expect(sheet.declares(/\.Offline\s*\{([^}]*)\}/, 'background')).toBe(false);
  });

  it('draws a character and a name in a seat, and a score beside it', () => {
    // The name is what a player looks for in a room they have just joined, where a face alone
    // asks them to remember which one they picked.
    expect(sheet.flat).toContain('.Name');
    expect(sheet.flat).toContain('.Score');
  });
});

describe('the tokens behind it', () => {
  it('holds twelve players, and says so as a count rather than a length', () => {
    expect(tokenValue('--Layout-PlayerBarSlots')).toBe('12');
  });

  it('holds exactly what a room holds, so nobody is drawn past the end or dropped from it', () => {
    // The same number as `GameConfig.limits.maxPlayers`, and a token rather than a copy of that
    // value because Design may not read Game — which is what makes this test the only thing
    // keeping the two together.
    expect(tokenValue('--Layout-PlayerBarSlots')).toBe(String(GameConfig.limits.maxPlayers));
  });

  it('falls back to the number it declares, so a page without tokens still has a bar', () => {
    expect(FallbackSlots).toBe(Number(tokenValue('--Layout-PlayerBarSlots')));
  });

  it('advances half a seat per item, so two seats apart land one hexagon along', () => {
    // The whole of the honeycomb, in one number: a pointy-topped hexagon tiles in ranks a hexagon
    // apart along, so the row has to advance a half seat per seat. A seat that keeps its full
    // width puts its rank-mate a hexagon and a half away and the ranks fan apart with daylight
    // between them, which is the row looking stacked rather than tiled.
    expect(tokenValue('--Offset-PlayerBarHoneycomb')).toBe(
      'calc(var(--Size-PlayerBarSlot) * -0.5)',
    );
  });

  it('drops every other seat three quarters of a hexagon, into the hollows', () => {
    // Three quarters of the hexagon's height, which is the seat's width times the row's own
    // aspect ratio, so the two cannot drift apart as the clamp moves.
    expect(sheet.declaration(/\.Seat:nth-child\(even\)\s*\{([^}]*)\}/, 'margin-top')).toBe(
      'var(--Offset-PlayerBarZigzag)',
    );
    expect(tokenValue('--Offset-PlayerBarZigzag')).toBe(
      'calc(var(--Size-PlayerBarSlot) * 1.1547 * 0.75)',
    );
    // And the offset is on the drop alone: a horizontal margin here as well would compound the
    // half seat down the row instead of cancelling it, which is what fanned the ranks apart.
    expect(sheet.declares(/\.Seat:nth-child\(even\)\s*\{([^}]*)\}/, 'margin-left')).toBe(false);
  });

  it('leaves no gap of its own between the seats', () => {
    // A positive gap here is width spent on nothing between shapes that tile flat, and the
    // half-seat offset already places each seat against its neighbour.
    expect(sheet.declares(/\.Root\s*\{([^}]*)\}/, 'gap')).toBe(false);
    expect(sheet.text).not.toContain('--Space-PlayerBarGap');
  });

  it('takes six and a half seats of width and a hexagon and three quarters of height', () => {
    // Twelve seats advancing half a seat each: the row is half as wide as a straight line of
    // them and shorter than two staggered rows, which is what lets a phone hold a full room.
    const seat = Number(tokenValue('--Size-PlayerBarSlot').match(/7vw/)?.[0].replace('vw', ''));
    expect(seat * (6 + 0.5)).toBeLessThan(320);
  });

  it('keeps the seat the host on the top edge, since the row is measured from there', () => {
    // Only the even seats drop: the first is the host's, and it is the one a crown hangs above,
    // so it cannot be the seat that moved down.
    expect(sheet.text).toContain('.Seat:nth-child(even)');
    expect(sheet.text).not.toContain(':nth-child(odd)');
  });
});

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

  it('hangs the crown half above the host\'s seat, and out of the flow', () => {
    // Half above: lifted by its own height, so it sits on the top edge like a mark on a seat
    // rather than as a fourth line under a name. `translate` rather than `transform`, since the
    // sway animates `transform` on this same node and the centring has to compose with it.
    expect(declaration('Crown', 'position')).toBe('absolute');
    expect(declaration('Crown', 'top')).toBe('0');
    expect(declaration('Crown', 'left')).toBe('50%');
    expect(declaration('Crown', 'translate')).toBe('-50%-50%');
    expect(sheet.declares(/\.Crown\s*\{([^}]*)\}/, 'background')).toBe(false);
  });

  it('draws the host crown in the room\'s yellow, like the Start button', () => {
    expect(declaration('Crown', 'color')).toBe('var(--Color-Room-Yellow)');
    expect(sheet.ruleBody(/\.CrownIcon\s*\{([^}]*)\}/)).toContain('Crown.svg');
    // Composed from the shared primitive: two copies of the sway would be one movement that had
    // quietly forked.
    expect(sheet.ruleBody(/\.Crown\s*\{([^}]*)\}/)).toContain('Sway.module.css');
  });

  it('marks the local player with the accent wash, since a ring inside a hexagon is a ring in a ring', () => {
    expect(declaration('Self .Slot', 'background')).toBe('var(--Accent-Wash)');
  });

  it('holds a dropped player back rather than removing them from the bar', () => {
    expect(declaration('Offline', 'opacity')).toBe('0.5');
    expect(sheet.declares(/\.Offline\s*\{([^}]*)\}/, 'background')).toBe(false);
  });

  it('draws a character and a crown and nothing else in a seat', () => {
    // No name and no score: twelve of those in one row would not fit, and a face is what a
    // player recognises rather than reads.
    expect(sheet.flat).not.toContain('.Name');
    expect(sheet.flat).not.toContain('.Score');
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

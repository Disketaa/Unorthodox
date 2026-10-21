import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';

/** The room's places, read from their stylesheet rather than rendered: happy-dom does not lay
 * out a row, so a rendered list says nothing about how the places are cut or how big they are. */
const sheet = stylesheet('../Source/Design/Components/Leaderboard/Leaderboard.module.css');
const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenValue = tokenReader(tokens);

const Root = /\.Root[^{]*\{([^}]*)\}/;
const frame = stylesheet('../Source/Screens/LeaderboardScreen/LeaderboardScreen.module.css');
const Frame = /\.Frame[^{]*\{([^}]*)\}/;
const bar = stylesheet('../Source/Design/Components/PlayerBar/PlayerBar.module.css');
const Row = /\.Row[^{]*\{([^}]*)\}/;
const Idle = /\.Idle[^{]*\{([^}]*)\}/;
const Offline = /\.Offline[^{]*\{([^}]*)\}/;
const Name = /\.Name[^{]*\{([^}]*)\}/;
const Total = /\.Total[^{]*\{([^}]*)\}/;
const MineInk = /\.Mine \.Name,\s*\.Mine \.Total\s*\{([^}]*)\}/;
const Place = /\.Place[^{]*\{([^}]*)\}/;
const Figure = /\.Figure[^{]*\{([^}]*)\}/;
const Fill = /\.Fill[^{]*\{([^}]*)\}/;
const texture = stylesheet(
  '../Source/Design/Overlays/TextureOverlay/TextureOverlay.module.css'
);
const Texture = /\.Texture[^{]*\{([^}]*)\}/;
const Stone = /\.Stone[^{]*\{([^}]*)\}/;

describe('the room standing', () => {
  it('is a list of places, and takes the room it is given', () => {
    // A place is a line of a table and reads as one. The rows are placed in the room the list is
    // given rather than stacked in it, so a list of a dozen fits a phone and a projector alike
    // without scrolling either of them.
    expect(sheet.declaration(Root, 'position')).toBe('relative');
    expect(sheet.declaration(Row, 'position')).toBe('absolute');
    expect(sheet.declaration(Row, 'height')).toContain('var(--Row-Count)');
  });

  it('moves a place to another slot rather than cutting to it', () => {
    // The places are rearranged once the round has been added up, and a row that jumped to its new
    // place would read as the row being replaced rather than as the order changing.
    expect(sheet.declaration(Row, 'translate')).toContain('var(--Row-At');
    expect(sheet.declaration(Row, 'transition')).toBe(
      'translatevar(--Duration-LeaderboardReorder)var(--Easing-Smooth)'
    );
  });

  it('idles the whole row once it has arrived, with the sway’s lean dialled out', () => {
    // The bar and the line written on it rock as one, rather than a bar holding still under a
    // line that moves. The sway takes the row's one `animation` after the arrival, since both
    // write `transform`; the lean goes because a place is a line across the room, and a lean on
    // a line tips it rather than rocks it.
    expect(sheet.declaration(Row, 'animation')).toContain('PlaceAppear');
    expect(sheet.declaration(Idle, 'composes')).toContain('Moving');
    expect(sheet.declaration(Idle, 'animation')).toBe('var(--Sway-Animation)');
    expect(sheet.declaration(Idle, '--Sway-Lean')).toBe('0');
  });

  it('holds a lost player’s line back by the same half as the bar', () => {
    // A player the host has lost keeps their line, held back rather than dropped. The half is the
    // bar's own half, read here too because a room that held a dropped player back by two
    // different amounts would have two meanings for one held-back thing. The row wears it as a
    // filter rather than as its own opacity, so the arrival fades the held-back line in as it
    // fades every other one.
    expect(sheet.declaration(Offline, 'filter')).toBe('opacity(0.5)');
    expect(bar.declaration(Offline, 'opacity')).toBe('0.5');
  });

  it('measures every row, so the figures in it are shares of the room it was given', () => {
    // The size of a place is a share of its own row rather than a length written down for one
    // screen, which is what lets the same list fit a short screen and a tall one.
    expect(sheet.declaration(Row, 'container-type')).toBe('size');
    expect(sheet.declaration(Place, 'font-size')).toContain('cqh');
    expect(sheet.declaration(Figure, 'width')).toContain('cqh');
  });

  it('leads the line with the place, in the player’s own colour', () => {
    // The number is about the order, but it is the player's place and it is worn as theirs — a
    // wash of their own colour, at the head of the line, so the row is found by where it stands
    // and read by its name. It is a column of its own rather than a shape behind the body: a
    // number behind a player is a shape, and the place is something the room reads.
    const columns = sheet.text.match(/grid-template-columns:\s*([^;]+);/)?.[1];
    expect(columns?.trim().split(/\s+/)).toEqual(['auto', 'auto', '1fr', 'auto']);
    expect(sheet.declaration(Place, 'position')).toBe('relative');
    // The column is as wide as the last place needs and the figure is centred in it, so the
    // places line up down the list without standing a digit's width away from the player.
    expect(sheet.declaration(Place, 'width')).toBe('var(--Place-Width,1ch)');
    expect(sheet.declaration(Place, 'text-align')).toBe('center');
    // The room at either end of the row is the same, so a line reads as a line rather than as a
    // column pushed up against one edge.
    expect(sheet.declaration(Row, 'padding')).toBe('0var(--Space-Lg)');
    expect(sheet.declaration(Place, 'color')).toContain('var(--Character-Tint)');
    expect(sheet.declaration(Place, 'color')).toContain('color-mix');
    // The same size as the standing it is read against, so the two numbers on the line are one
    // voice rather than one shouting over the other.
    expect(sheet.declaration(Place, 'font-size')).toBe(sheet.declaration(Total, 'font-size'));
    expect(sheet.declaration(Figure, 'position')).toBe('relative');
  });

  it('writes our own name and standing in our accent, and no one else’s', () => {
    // The one line the player is looking for is theirs, and it is written in the accent they
    // chose; every other line stays the ink every panel in the game uses.
    expect(sheet.declaration(Name, 'color')).toBe('var(--Color-Text-Default)');
    expect(sheet.declaration(Total, 'color')).toBe('var(--Color-Text-Default)');
    expect(sheet.declaration(MineInk, 'color')).toBe('var(--Accent-Tint)');
  });

  it('has no hexagon of its own, so the player is drawn on the paper', () => {
    // The body is the shape: a hexagon under a character would be a second body, and the art is
    // drawn to sit on the table rather than in a badge.
    expect(sheet.declares(Figure, 'background')).toBe(false);
    expect(sheet.declares(Figure, 'mask')).toBe(false);
    expect(sheet.declaration(Root, 'width')).toBe('100%');
    expect(frame.declaration(Frame, 'max-width')).toBe('var(--Layout-ThemeCardsMaxWidth)');
  });

  it('wears the stone the page wears, tiled into the bar rather than stretched over it', () => {
    // A bar is a fraction of the page, so the stone is tiled at its own size exactly as it is on
    // the page, and held further back than the page holds it: a bar is read as a figure, and the
    // stone is there to say what it is made of rather than to be looked at.
    expect(sheet.declares(Fill, 'background-image')).toBe(false);
    expect(sheet.declaration(Fill, '--Overlay-StoneOpacity')).toBe(
      'var(--Opacity-LeaderboardStone)'
    );
    expect(Number(tokenValue('--Opacity-LeaderboardStone'))).toBeLessThan(
      Number(tokenValue('--Overlay-StoneOpacity'))
    );
    expect(sheet.flat).not.toContain('Stone.jpg');
    expect(texture.declares(Texture, 'background-size')).toBe(false);
    expect(texture.declaration(Texture, 'background-repeat')).toBe('repeat');
  });

  it('names each texture once, so a surface that wears one asks for it by name', () => {
    // The paper and the stone are named in the tokens, and the overlay reads those names: a
    // second surface wearing the stone does not spell out a file of its own.
    expect(texture.declaration(Stone, '--Overlay-Texture')).toBe('var(--Texture-Stone)');
    expect(texture.flat).not.toContain('url(');
  });
});

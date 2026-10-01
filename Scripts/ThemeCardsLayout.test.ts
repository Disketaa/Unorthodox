import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';
import { GameConfig } from '../Source/Game';
import { ThemeIds, dealThemes, createRandom, randomFor } from '../Source/Core';
import { turnFor } from '../Source/Design/Components/ThemeCards/CardTurn';

/**
 * The bank of theme cards, read from the stylesheet and the token file.
 *
 * Out here for the reason `Scripts/PlayerBarLayout.test.ts` is: happy-dom does not lay
 * out a flex row and does not compose a 3D transform, so a rendered `ThemeCards` says
 * nothing about which card is turned or how far the vanishing point is. The turn itself
 * is arithmetic and is tested as arithmetic, below.
 */
const sheet = stylesheet('../Source/Design/Components/ThemeCards/ThemeCards.module.css');
const card = stylesheet('../Source/Design/Components/ThemeCard/ThemeCard.module.css');

const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);

/** The row, which is where the perspective and the cap live. */
const Root = /\.Root\s*\{([^}]*)\}/;

/** One card's slot, which is where the measured turn is applied. */
const Slot = /\.Slot\s*\{([^}]*)\}/;

describe('the row of theme cards', () => {
  it('views the cards from one vanishing point rather than six', () => {
    // A `perspective` per card would give every card its own viewpoint, and six cards
    // would fan out from six different places instead of lying on one table.
    expect(sheet.declaration(Root, 'perspective')).toBe('var(--Perspective-ThemeCards)');
  });

  it('wraps onto a second row rather than scrolling, as the bar of players does', () => {
    // A card too narrow for its own name is a card nobody can read, and a bank the player
    // has to swipe sideways is a bank they never see whole.
    expect(sheet.declaration(Root, 'display')).toBe('flex');
    expect(sheet.declaration(Root, 'flex-wrap')).toBe('wrap');
    expect(sheet.flat).not.toContain('overflow-x');
  });

  it('caps the row at three cards, so the bank is never a row of four over a pair', () => {
    // Six fixed-width cards fit easily across a desktop, and then the fourth starts a
    // second row by itself — the arrangement the fan was written to avoid. The cap is on
    // the row's width rather than on the window, so the fourth always wraps.
    expect(sheet.declaration(Root, 'max-width')).toBe('var(--Layout-ThemeCardsMaxWidth)');
    expect(GameConfig.themes.cardsPerLobby).toBe(6);
    expect(tokenValue('--Layout-ThemeCardsMaxWidth').replace(/\s+/g, '')).toBe(
      'calc(3*var(--Size-ThemeCardWidth)+2*var(--Space-ThemeCardsGap))',
    );
  });

  it('gives every card the same width, so the bank reads as six equal panels', () => {
    // Cards that grew to fill the row would each be a slightly different size, and an
    // arrangement of six things is only an arrangement if the six match.
    expect(sheet.declaration(Slot, 'flex')).toBe('00var(--Size-ThemeCardWidth)');
    expect(sheet.declaration(Slot, 'width')).toBe('var(--Size-ThemeCardWidth)');
  });

  it('takes the shape of a card from its width, so a narrower card is shorter too', () => {
    // A height as well would be a second number free to disagree with the width, and the
    // six would stop being six matching panels on whichever screen they disagreed.
    expect(sheet.declaration(Slot, 'aspect-ratio')).toBe('var(--Ratio-ThemeCard)');
    expect(card.declaration(/\.Name\s*\{([^}]*)\}/, 'height')).toBe('100%');
  });

  it('turns each card about its own centre, which is what closes the row on a point', () => {
    // A slot turned about its outside edge swings away from the middle instead of towards
    // it, so the row opens out rather than closing in.
    expect(sheet.declaration(Slot, 'transform-origin')).toBe('center');
  });

  it('does not ask for a 3D context it has nothing to put in', () => {
    // The cards are flat surfaces with nothing nested inside them. `preserve-3d` here is
    // what let a card's border be drawn as a plane floating off its own fill — the flat
    // broken edges that made this read as a rendering fault rather than as an arrangement.
    expect(sheet.text).not.toContain('preserve-3d');
  });

  it('reads its angles and its distance from tokens, with no number of its own', () => {
    // The zeroes are the unmeasured fallback, not a written angle: the real ones are
    // degrees parsed out of the tokens by the hook.
    const numbers = sheet.text.replace(/0deg/g, '');
    expect(numbers).not.toMatch(/\d+deg/);
    expect(numbers).not.toMatch(/\d+px/);
    expect(numbers).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('turns the card by what the measurement wrote, not by a position in the row', () => {
    // Six fixed angles would be right at one window size and wrong at every other, since
    // a card's distance from the middle of the screen moves with the window.
    expect(sheet.declaration(Slot, 'transform')).toBe(
      'rotateY(var(--ThemeCard-Yaw,0deg))rotateX(var(--ThemeCard-Pitch,0deg))',
    );
    expect(sheet.text).not.toContain('nth-child');
  });
});

describe("a card's own name", () => {
  it("is written in the same ink for everyone, not in the viewer's accent", () => {
    // The accent is the tint a player picked for themselves. Six cards of it would say
    // whose screen this is rather than what the room could play, and every player in the
    // room has to read the same six names.
    expect(card.declaration(/\.Name\s*\{([^}]*)\}/, 'color')).toBe('var(--Color-Text-Default)');
    expect(card.flat).not.toContain('--Color-Text-Title');
    expect(card.flat).not.toContain('--Accent-');
  });

  it('takes its colour and its padding from tokens, so one edit moves all six', () => {
    expect(card.text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(card.declaration(/\.Name\s*\{([^}]*)\}/, 'padding')).toBe(
      'var(--Space-ThemeCardPadding)',
    );
    expect(card.declaration(/\.Name\s*\{([^}]*)\}/, 'font-size')).toBe(
      'var(--FontSize-ThemeCard)',
    );
  });

  it('keeps the name off the frame of its own card', () => {
    // At zero the longest word touches the edge, and on a turned card that edge is the
    // most visible one there is.
    expect(Number(tokenValue('--Space-ThemeCardPadding').replace('px', ''))).toBeGreaterThan(0);
  });
});

describe('the tokens behind the bank', () => {
  it('turns the cards further sideways than it tips them', () => {
    // Equal angles read as six panels lying flat, which is not what a bank of screens does.
    const yaw = Number(tokenValue('--Angle-ThemeCardYaw').replace('deg', ''));
    const pitch = Number(tokenValue('--Angle-ThemeCardPitch').replace('deg', ''));
    expect(yaw).toBeGreaterThan(pitch);
  });

  it('keeps every card a similar size, which is what a long perspective is for', () => {
    // A short one turns the middle card least and shrinks the outer ones hard, so the row
    // would have a subject it never asked for.
    const distance = Number(tokenValue('--Perspective-ThemeCards').replace('px', ''));
    const width = Number(tokenValue('--Layout-ContainerMaxWidth').replace('px', ''));
    expect(distance).toBeGreaterThan(width * 2);
  });

  it('holds a card wider than it is tall, so six of them read as panels and not columns', () => {
    const ratio = tokenValue('--Ratio-ThemeCard').split('/').map(Number);
    expect(ratio[0]).toBeGreaterThan(ratio[1] as number);
  });

  it('narrows a card to what two of them need, so a phone holds a row rather than a list', () => {
    // A flat width meant one card per row on anything narrower than two of them plus the
    // gap, and six turned cards stood in a column. The width is capped at half the window
    // less the gaps and the page's own padding either side, which is the two-card floor.
    const width = tokenValue('--Size-ThemeCardWidth').replace(/\s+/g, '');
    expect(width).toContain('min(320px,calc(');
    expect(width).toContain('100vw-3*var(--Space-ThemeCardsGap)');
    expect(width).toContain('/2)');
    const gap = Number(tokenValue('--Space-ThemeCardsGap').replace('px', ''));
    const padding = Number(tokenValue('--Layout-ScreenPaddingHorizontal').replace('px', ''));
    const narrowest = 2 * gap + 2 * padding;
    // The narrowest window the floor is written for is the one two cards have to fit in at
    // their smallest: whatever the cap resolves to, a card plus its gap stays under half.
    expect(narrowest).toBeLessThan(Number(tokenValue('--Layout-ColumnMinWidth').replace('px', '')));
  });

  it('names a theme large enough to be the content of a panel, not a caption on one', () => {
    // The only name in the game drawn as the whole content of a card rather than as a
    // heading over something, and a share of the card's width rather than a size of its
    // own: the card narrows on a phone, and a flat size would be a caption again there.
    const size = tokenValue('--FontSize-ThemeCard').replace(/\s+/g, '');
    expect(size).toBe('calc(var(--Size-ThemeCardWidth)*0.115)');
    const card = stylesheet('../Source/Design/Components/ThemeCard/ThemeCard.module.css');
    expect(card.declaration(/\.Name\s*\{([^}]*)\}/, 'font-size')).toBe(
      'var(--FontSize-ThemeCard)',
    );
  });
});

describe('the turn of one card', () => {
  const Yaw = Number(tokenValue('--Angle-ThemeCardYaw').replace('deg', ''));

  it('leaves a card dead centre unturned', () => {
    expect(turnFor(0, 1000, Yaw)).toBe(0);
  });

  it('turns the two sides opposite ways, which is what makes it a bank', () => {
    // Both cards are the same distance out, so the same magnitude and the opposite sign.
    expect(turnFor(-300, 1000, Yaw)).toBeCloseTo(-turnFor(300, 1000, Yaw), 5);
  });

  it('turns each card towards the middle, as a fan of cards is held out', () => {
    // A positive `rotateY` brings a card's left edge towards the viewer, so a card right of
    // the middle takes the positive one. The other sign leans the bank away from the player,
    // which is a ring of panels turned towards the room rather than six cards held out.
    expect(turnFor(300, 1000, Yaw)).toBeGreaterThan(0);
    expect(turnFor(-300, 1000, Yaw)).toBeLessThan(0);
  });

  it('turns a card further out further, so the angle follows the window', () => {
    // The whole reason the turn is measured: the same card is 300px from the middle on a
    // phone and 700 on a desktop, and it has to turn differently on each.
    expect(Math.abs(turnFor(700, 2000, Yaw))).toBeGreaterThan(Math.abs(turnFor(300, 2000, Yaw)));
  });

  it('never turns a card past the angle the token declares', () => {
    // A card further off screen than the viewport is half-width is at the edge of it, and
    // is held at the full turn rather than continuing past it.
    expect(turnFor(5000, 1000, Yaw)).toBe(Yaw);
    expect(turnFor(-5000, 1000, Yaw)).toBe(-Yaw);
  });

  it('turns nothing when there is no window to measure against', () => {
    // Dividing by a zero half-width is a card pointing at the ceiling; this is what a page
    // rendered before it has a size looks like instead.
    expect(turnFor(300, 0, Yaw)).toBe(0);
  });
});

describe('the deal', () => {
  it('offers six themes without repeating one', () => {
    const deal = dealThemes(createRandom(11), GameConfig.themes.cardsPerLobby);
    expect(deal).toHaveLength(GameConfig.themes.cardsPerLobby);
    expect(new Set(deal).size).toBe(deal.length);
    expect(deal.every((theme) => ThemeIds.includes(theme))).toBe(true);
  });

  it('never offers more themes than exist', () => {
    const deal = dealThemes(createRandom(3), ThemeIds.length + 5);
    expect(deal).toHaveLength(ThemeIds.length);
  });

  it('gives one lobby the same themes as another device in it', () => {
    // The property the whole arrangement rests on: the deal is rolled from the room code,
    // so a client cannot come up with a different hand from the host.
    const here = dealThemes(randomFor('ABCD'), GameConfig.themes.cardsPerLobby);
    const there = dealThemes(randomFor('ABCD'), GameConfig.themes.cardsPerLobby);
    expect(here).toEqual(there);
  });

  it('gives two rooms different hands', () => {
    const first = dealThemes(randomFor('ABCD'), GameConfig.themes.cardsPerLobby);
    const second = dealThemes(randomFor('WXYZ'), GameConfig.themes.cardsPerLobby);
    expect(first).not.toEqual(second);
  });

  it('is not the same six to every room', () => {
    // A deal that ignored its seed would hand every lobby in the game the same themes,
    // which is the failure the seeded generator exists to prevent.
    const deals = ['ABCD', 'WXYZ', 'QWER', 'ASDF'].map(
      (code) => dealThemes(randomFor(code), GameConfig.themes.cardsPerLobby).join(','),
    );
    expect(new Set(deals).size).toBeGreaterThan(1);
  });
});

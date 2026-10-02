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

const meter = stylesheet('../Source/Design/Components/RoundMeter/RoundMeter.module.css');

const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);

/** The row of round ticks, and one of them. */
const Meter = /\.Root\s*\{([^}]*)\}/;
const Mark = /\.Mark\s*\{([^}]*)\}/;
const Spent = /\.Spent\s*\{([^}]*)\}/;

/** The row, which is where the perspective and the cap live. */
const Root = /\.Root\s*\{([^}]*)\}/;

/** One card's slot, which is where the measured turn is applied. */
const Slot = /\.Slot\s*\{([^}]*)\}/;

/** The card itself, and what is layered on it. */
const Card = /\.Root\s*\{([^}]*)\}/;
const CardMark = /\.Mark\s*\{([^}]*)\}/;
const Initial = /\.Initial\s*\{([^}]*)\}/;
const InitialHover = /\.Root:hover \.Initial\s*\{([^}]*)\}/;
const Noise = /\.Noise\s*\{([^}]*)\}/;
const Name = /\.Name\s*\{([^}]*)\}/;

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
    // second row by itself вЂ” the arrangement the bank was written to avoid. The cap is on
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
    expect(card.declares(Name, 'height')).toBe(false);
  });

  it('turns each card about its own centre, which is what closes the row on a point', () => {
    // A slot turned about its outside edge swings away from the middle instead of towards
    // it, so the row opens out rather than closing in.
    expect(sheet.declaration(Slot, 'transform-origin')).toBe('center');
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

describe('the theme cards', () => {
it('washes in the theme accent on hover, in the same time as every other control', () => {
    // The fill is the pale wash and the name and border take the tint вЂ” the accent as the
    // game draws it everywhere else. The ink is the same hue turned down until text can sit
    // on that wash, and using it here made a hovered card a different colour from the rest of
    // the theme it belongs to.
    const hover = /\.Root:hover\s*\{([^}]*)\}/;
    expect(card.declaration(hover, 'background')).toContain('var(--ThemeCard-Wash');
    expect(card.declaration(hover, 'color')).toContain('var(--ThemeCard-Tint');
    expect(card.declaration(hover, 'color')).not.toContain('--ThemeCard-Ink');
    expect(card.text).toContain('--Duration-Fast');
    expect(card.text).toContain('--Easing-Standard');
  });

  it('has no frame, and is one step off the page rather than white on it', () => {
    // The border and the off-white both lift the card off the page, and a card this large does
    // not need both: with the frame gone the rounded corner and the fill are the whole edge,
    // which is what lets six of them read as six panels rather than six outlines. The off-
    // white is the step the palette already has, not a second grey beside it.
    expect(card.declaration(Card, 'border')).toBe('none');
    expect(card.declaration(Card, 'background')).toBe('var(--Color-Surface-Hover)');
    expect(card.ruleBody(/\.Root:hover\s*\{([^}]*)\}/)).not.toContain('border');
  });

  it('draws the focus ring outside the fill, since there is no border to recolour', () => {
    // It used to recolour the card's own border, which kept a focused card from showing two
    // frames at once. With no frame the ring has to be drawn outside, and an outline does that
    // without taking any of the card's width вЂ” a focused card that grew a pixel would be a card
    // out of line with the five beside it.
    const focus = /\.Root:focus-visible\s*\{([^}]*)\}/;
    expect(card.declaration(focus, 'outline')).toContain('var(--Color-Border-Focus)');
    expect(card.declaration(focus, 'outline-offset')).toBe('var(--Border-Width-Default)');
  });

  it("wears the viewer's ink at rest, taking the theme's accent only on hover", () => {
    // The accent is the tint a player chose for themselves. Wearing it on six cards at rest
    // would say whose screen this is rather than what the room could play; on hover it is
    // the card's own colour answering the pointer, which is a fact about the card.
    expect(card.declaration(Name, 'color')).toBe('inherit');
    expect(card.declaration(Card, 'color')).toBe('var(--Color-Text-Default)');
  });

  it('presses with a scale rather than a transform, so the sway is not cancelled', () => {
    // The sway animates `transform` on this node and an animation outranks a transition on
    // the same property, so a press on `transform` would shrink the card for one frame and
    // then stop. `scale` is its own property and composes with the movement.
    expect(card.declaration(/\.Root:active\s*\{([^}]*)\}/, 'scale')).toBe('0.97');
    expect(card.ruleBody(/\.Root:active\s*\{([^}]*)\}/)).not.toContain('transform');
  });

it('draws the theme initial as one letter in a pale grey, at full strength', () => {
    // The one thing on the card that says which theme this is without being the name. Grey
    // rather than any step of the accent: the tint is what the ticks and the hovered name are
    // drawn in, so a corner letter in it would compete with both, and the ink is dark enough
    // to read as a second label. A pale step rather than the grey the number behind the name
    // wears, because that one is already on the card. It answers the pointer with the theme's
    // wash: the card has already gone to the wash under it, so a corner letter left in the grey
    // would be the one thing on the card still at rest — and the darkened accent rather than the
    // wash, since a letter in the wash would be the one thing on the card that did not answer.
    // At full strength rather than faded, because a corner letter faded is a mark that is
    // neither the name nor the theme.
    expect(card.declaration(Initial, 'color')).toBe('var(--Color-Neutral-300)');
    expect(card.declaration(InitialHover, 'color').replace(/\s+/g, '')).toBe(
      'var(--ThemeCard-Ink,var(--Accent-Ink))',
    );
    expect(card.declaration(Initial, 'pointer-events')).toBe('none');
  });

  it('puts the initial in the card corner at a share of the card, so it is the same mark everywhere', () => {
    // A letter in the corner is a mark printed on the card the way a catalogue entry prints
    // one, not a figure the card is showing, so it is held by the card's own padding rather
    // than pushed past the centre. A share of the width for its size, so a card that narrows on
    // a phone gets a letter that narrows with it.
    expect(card.declaration(Initial, 'top')).toBe('var(--Space-ThemeCardPadding)');
    expect(card.declaration(Initial, 'left')).toBe('var(--Space-ThemeCardPadding)');
    expect(card.declaration(Initial, 'font-size')).toBe('var(--FontSize-ThemeCardInitial)');
    expect(tokenValue('--FontSize-ThemeCardInitial').replace(/\s+/g, '')).toBe(
      'calc(var(--Size-ThemeCardWidth)*0.0775)',
    );
  });
it('is one figure, cut off by the card, and not a second thing written on it', () => {
    // A single number is the panel's substance; a name repeated behind the name competes with
    // it, and the name is what the card is for.
    expect(card.declaration(CardMark, 'position')).toBe('absolute');
    expect(card.declaration(CardMark, 'overflow')).toBe('hidden');
    expect(card.declaration(CardMark, 'font-size')).toBe('var(--FontSize-ThemeCardMark)');
    expect(card.declaration(Name, 'z-index')).toBe('1');
  });

  it('sits past the bottom right corner rather than centred in the card', () => {
    // Centred, a figure larger than the card is a figure inside a card; pushed into the
    // corner it is most of a number with two sides of it cut, which is the whole of it.
    expect(card.declaration(CardMark, 'top')).toBe('50%');
    expect(card.declaration(CardMark, 'left')).toBe('50%');
    expect(card.declaration(CardMark, 'translate')).toBe(
      'var(--Offset-ThemeCardMark)var(--Offset-ThemeCardMark)',
    );
  });

  it('holds its offset in its own size, so it does not come back inside a small card', () => {
    // The card narrows on a phone and a fixed inset would put the figure back inside it,
    // which is the case the offset exists to avoid.
    expect(tokenValue('--Offset-ThemeCardMark')).toMatch(/em$/);
  });

  it('is drawn far larger than the card, or it is a number on a card', () => {
    const mark = Number(
      tokenValue('--FontSize-ThemeCardMark').match(/[\d.]+/)?.[0],
    );
    const name = Number(tokenValue('--FontSize-ThemeCard').match(/[\d.]+/)?.[0]);
    expect(mark).toBeGreaterThan(name * 8);
  });

it('is held back with opacity rather than with a colour of its own', () => {
    // The name is drawn in the tint and has to stay the stronger of the two, so the mark
    // cannot be a paler version of that hue вЂ” it is grey and faint, which are two separate
    // things from the colour.
    expect(card.declaration(CardMark, 'opacity')).toBe('var(--Opacity-ThemeCardMark)');
  });

  it('is the card quiet grey at rest, and the theme tint under the pointer', () => {
    // Grey rather than a faded tint, and that is what makes it read as a number *behind* the
    // theme: a weaker tint is still the theme's own hue and competes with the ticks and the
    // name because it is their colour, while grey is the one colour nothing else on the card
    // is wearing. It was inheriting the card's quiet ink too, so the bank read as six grey
    // cards with six coloured strips вЂ” the number is the biggest thing on a card and was the
    // one thing on it not wearing the theme.
    expect(card.declaration(CardMark, 'color')).toBe('var(--Color-Text-Quiet)');
    expect(card.declaration(/\.Root:hover\s+\.Mark\s*\{([^}]*)\}/, 'color')).toBe(
      'var(--ThemeCard-Tint,var(--Accent-Tint))',
    );
  });

it('answers the pointer differently from how it rests', () => {
    // Which way it goes is a matter of taste and has changed; that it goes is not. A mark that
    // did not answer at all would be a figure on a card that did not notice it was being
    // looked at.
    const resting = Number(tokenValue('--Opacity-ThemeCardMark'));
    const lifted = Number(tokenValue('--Opacity-ThemeCardMarkHover'));
    expect(resting).toBeGreaterThan(0);
    expect(resting).toBeLessThan(1);
    expect(lifted).not.toBe(resting);
    expect(lifted).toBeGreaterThan(0);
    expect(lifted).toBeLessThan(1);
  });

it('opens a beat after the name, long enough to see, and on the way out as well', () => {
    // A delay written on the `:hover` rule applies to the change into it and not out of it,
    // so a mark that waited to close would hang on the card after the pointer had gone.
    expect(card.ruleBody(CardMark)).toContain('--Duration-ThemeCardMarkDelay');
    expect(card.ruleBody(/\.Root:hover\s+\.Mark\s*\{([^}]*)\}/)).not.toContain('transition');
    const delay = Number(tokenValue('--Duration-ThemeCardMarkDelay').replace('ms', ''));
    const hover = Number(tokenValue('--Duration-Fast').replace('ms', ''));
    expect(delay).toBeLessThan(hover);
    // A quarter of the movement was not noticeable at all: the mark had barely begun to move
    // before the name had finished, so there was no gap to see. Three fifths leaves the name a
    // clear moment on its own and still lands the mark inside the hover.
    expect(delay / hover).toBeGreaterThan(0.5);
  });

  it('moves the mark further than the name, because a clipped figure needs more to shift', () => {
    // The mark is already larger than the card, so the name's scale is nearly invisible on it
    // and the delay had almost nothing to separate. It has to be the larger of the two by a
    // clear margin to move at all inside the crop.
    const name = Number(tokenValue('--Scale-ThemeCardHover'));
    const mark = Number(tokenValue('--Scale-ThemeCardMarkHover'));
    expect(mark).toBeGreaterThan(name);
    expect(mark).toBeGreaterThan(1.2);
  });

  it('lays grain over the card rather than fogging it', () => {
    // A noise tile at any opacity below one is a grey wash unless it is blended, because
    // the tile has grey in its light parts as well as its dark.
    expect(card.declaration(Noise, 'mix-blend-mode')).toBe('var(--Blend-ThemeCardNoise)');
    expect(card.declaration(Noise, 'opacity')).toBe('var(--Opacity-ThemeCardNoise)');
  });

it('blends the grain into the card rather than drawing it opaquely', () => {
    // A noise tile at any opacity below one is a grey wash unless it is blended, because the
    // tile has grey in its light parts as well as its dark. Which blend it is has changed more
    // than once while this was being looked at вЂ” the pale card defeats some of them вЂ” so what
    // is held here is that it is blended at all, and that it is not the unblended default.
    const blend = tokenValue('--Blend-ThemeCardNoise');
    expect(blend).not.toBe('normal');
    expect(blend.length).toBeGreaterThan(0);
  });

  it('draws the grain at its own pixels, because reducing it destroys it', () => {
    // Any `background-size` reduction averages the grain into a flat grey before the browser
    // blends anything, and a flat grey multiplied over a card is the card. The grain exists at
    // the original size and shrinking it is what made it invisible in the first place.
    expect(card.declares(Noise, 'background-size')).toBe(false);
    expect(card.declaration(Noise, 'background-repeat')).toBe('repeat');
  });

  it('puts the grain over the name, the way a printed surface does', () => {
    // Clean type on a grained background looks like a screenshot of a card rather than a
    // card, and it is `pointer-events: none` because it covers the whole of the thing being
    // pressed вЂ” an overlay that ate the pointer would make half the card dead.
    expect(Number(card.declaration(Noise, 'z-index'))).toBeGreaterThan(
      Number(card.declaration(Name, 'z-index')),
    );
    expect(card.declaration(Noise, 'pointer-events')).toBe('none');
  });

it('holds the grain short of the name, which is the thing on the card being read', () => {
    // How faint exactly is a matter of taste and has moved both ways while this was being
    // looked at. What has not moved is that the grain is a finish over the card rather than
    // something competing with the name on it, so it never reaches full strength.
    const resting = Number(tokenValue('--Opacity-ThemeCardNoise'));
    const lifted = Number(tokenValue('--Opacity-ThemeCardNoiseHover'));
    expect(resting).toBeGreaterThan(0);
    expect(lifted).toBeGreaterThan(0);
    expect(lifted).toBeLessThan(1);
    expect(resting).toBeLessThan(1);
  });

  it('lifts the grain on hover, on the card timing', () => {
    // The panel is the thing being looked at and a finish that does not respond reads as a
    // surface that did not notice.
    expect(card.ruleBody(Noise)).toContain('--Duration-Fast');
    expect(card.ruleBody(/\.Root:hover\s+\.Noise\s*\{([^}]*)\}/)).not.toContain('transition');
  });

  it('is scaled on hover rather than resized, so nothing reflows under the pointer', () => {
expect(card.declaration(/\.Root:hover\s+\.Mark\s*\{([^}]*)\}/, 'transform')).toBe(
      'scale(var(--Scale-ThemeCardMarkHover))',
    );
    expect(card.declaration(CardMark, 'transform')).toBe('scale(1)');
  });

  it('opens with the name by one ratio, or the panel is one image changing size', () => {
    expect(card.declaration(/\.Root:hover\s+\.Name\s*\{([^}]*)\}/, 'font-size')).toBe(
      'calc(var(--FontSize-ThemeCard)*var(--Scale-ThemeCardHover))',
    );
  });
});

describe('the round ticks along the bottom of a card', () => {
it('sits directly under the name, as the second line of one thing', () => {
    // The card centres the name and the bar together as a column. Neither may grow, or one of
    // them takes the room and leaves the other against an edge вЂ” a growing name pinned the bar
    // to the bottom of the card with the word centred in whatever was left over, which read as
    // a centred name and a bottom-aligned bar rather than one thing read downwards.
    expect(card.declaration(Card, 'flex-direction')).toBe('column');
    expect(card.declaration(Card, 'justify-content')).toBe('center');
    expect(card.declaration(Name, 'flex')).toBe('00auto');
  });

  it('pulls the bar back up towards the name, and no further', () => {
    // `margin-top: auto` would put it back at the bottom edge. What closes the gap instead is
    // half the card's own padding taken back off the top: the card pads its contents, so the
    // row otherwise starts a whole inset below the word rather than just under it. Half,
    // because the bar is the second line of one thing being read and a line has leading вЂ” the
    // padding is a margin around the pair, not a gap between the two lines of it.
    expect(meter.declares(Meter, 'margin-top')).toBe(true);
    expect(meter.declaration(Meter, 'margin-top')).toBe(
      'calc(-1*var(--Space-ThemeCardPadding)/2)',
    );
    expect(meter.declares(Meter, 'width')).toBe(false);
  });

  it('insets the card once, rather than the name and the bar each holding their own', () => {
    // Two numbers saying one thing put the card's contents in by different amounts at the top
    // and the bottom. One inset on the card puts both in the same place.
    expect(card.declaration(Card, 'padding')).toBe('var(--Space-ThemeCardPadding)');
    expect(meter.declares(Meter, 'padding')).toBe(false);
  });

  it('centres the row rather than letting the card padding push it aside', () => {
    // The leftover width does not divide evenly between two cards of the same width вЂ” a name
    // wrapping to two lines on one card and not the next leaves that card's row off to one
    // side, and a bank of six with rows at different places is not a bank.
    expect(meter.declaration(Meter, 'justify-content')).toBe('center');
  });

it('draws every tick in the theme accent, and greys the spent ones by opacity', () => {
    // The bar is one thing the card is saying вЂ” this theme, this many rounds вЂ” so every tick
    // is that accent and a spent one is still that accent. The greying is opacity rather than
    // a paler colour for the same reason: a bar whose spent part is a different hue is a
    // bar showing two kinds of thing rather than one bar with less in it.
    expect(meter.declaration(Mark, 'background')).toBe('var(--ThemeCard-Tint,var(--Accent-Tint))');
    expect(meter.declaration(Spent, 'opacity')).toBe('var(--Opacity-RoundMarkSpent)');
    expect(meter.ruleBody(Spent)).not.toContain('background');
  });

  it('greys a spent tick without hiding it, or the theme looks shorter than it was', () => {
    // A spent round is still a round this theme had; a bar that deleted it would say the
    // theme was never as long as it was. A sixth of full strength is greyed enough to count
    // the spent ones across six cards and not so faint that the bar reads as shorter.
    const resting = Number(tokenValue('--Opacity-RoundMark'));
    const spent = Number(tokenValue('--Opacity-RoundMarkSpent'));
    expect(resting).toBe(1);
    expect(spent).toBeGreaterThan(0);
    expect(spent).toBeLessThan(resting / 4);
  });

  it('draws the ticks as pipes rather than dots', () => {
    // A row of dots on a card this size reads as a rating or a strength meter, and ten of one
    // shape is too many to count at a glance. A pipe is a mark in a list, which a round is.
    const width = Number(tokenValue('--Size-RoundMarkWidth').replace('em', ''));
    const height = Number(tokenValue('--Size-RoundMarkHeight').replace('em', ''));
    expect(height).toBeGreaterThan(width * 2);
  });

  it('sizes the ticks against the name, so the row scales with the card', () => {
    // `em` needs a font size to be a proportion of, and the row would otherwise measure its
    // ticks against whatever the page inherited вЂ” the same marks a different width on the
    // lobby and on the game. The name's size is already a share of the card's width.
    expect(meter.declaration(Meter, 'font-size')).toBe('var(--FontSize-ThemeCard)');
    for (const token of [
      '--Size-RoundMarkWidth',
      '--Size-RoundMarkHeight',
      '--Radius-RoundMark',
      '--Space-RoundMeterGap',
    ]) {
      expect(tokenValue(token)).toMatch(/em$/);
    }
  });



  it('plays ten rounds of a theme, which is what fills a round of the game', () => {
    // `GameConfig.rounds.count` is five rounds of the whole game, and two themes to a round is
    // what fills it: ten topics across the themes on offer, which is a set of themes big
    // enough that the cards are a choice rather than a formality.
    expect(GameConfig.themes.roundsPerTheme).toBe(GameConfig.rounds.count * 2);
    expect(GameConfig.themes.roundsPerTheme).toBe(10);
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

  it('names a theme large enough to be the content of a panel, not a caption on one', () => {
    // The only name in the game drawn as the whole content of a card rather than as a
    // heading over something, and a share of the card's width rather than a size of its
    // own: the card narrows on a phone, and a flat size would be a caption again there.
    const size = tokenValue('--FontSize-ThemeCard').replace(/\s+/g, '');
    expect(size).toBe('calc(var(--Size-ThemeCardWidth)*0.115)');
    expect(card.declaration(Name, 'font-size')).toBe('var(--FontSize-ThemeCard)');
  });

  it('keeps the name off the frame of its own card', () => {
    // At zero the longest word touches the edge, and on a turned card that edge is the most
    // visible one there is.
    expect(Number(tokenValue('--Space-ThemeCardPadding').replace('px', ''))).toBeGreaterThan(0);
    expect(card.declaration(Name, 'padding')).toBe('var(--Space-ThemeCardPadding)');
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


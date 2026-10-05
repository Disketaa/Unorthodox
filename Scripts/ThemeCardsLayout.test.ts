import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';
import { GameConfig } from '../Source/Game';
import { ThemeIds, dealThemes, createRandom, randomFor } from '../Source/Core';
/** The bank of theme cards, read from the stylesheet and the token file. Out here for the reason
 * `Scripts/PlayerBarLayout.test.ts` is: happy-dom does not lay out a flex row, so a rendered
 * `ThemeCards` says nothing about how wide the bank gets or how many cards fit across it. */
const sheet = stylesheet('../Source/Design/Components/ThemeCards/ThemeCards.module.css');
const card = stylesheet('../Source/Design/Components/ThemeCard/ThemeCard.module.css');
const meter = stylesheet('../Source/Design/Components/RoundMeter/RoundMeter.module.css');
const tokens = readFileSync(
  new URL('../Source/Design/Tokens/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);
/** A token written as a share of the card's width, as the number it multiplies it by. Several
 * things drawn on a theme card are shares of one width rather than lengths, which is how a
 * narrow screen scales the card instead of crowding it. Reading them as numbers is what lets a
 * test compare them with each other — an inset against a padding, a name's size against a
 * card's — without resolving a `calc()` a test DOM cannot lay out. */
/** The gap between cards at the narrowest screen, which is the floor of its `clamp`. */
function narrowestGap(): number {
  const match = tokenValue('--Space-ThemeCardsGap').match(/clamp\(\s*([0-9.]+)px/);
  if (match?.[1] === undefined) throw new Error('no floor in the gap between cards');
  return Number(match[1]);
}
function widthShare(name: string): number {
  const match = tokens.match(
    new RegExp(`${name}:\\s*calc\\(\\s*var\\(--Size-ThemeCardWidth\\)\\s*\\*\\s*([0-9.]+)\\s*\\)`, 'i'),
  );
  if (match?.[1] === undefined) throw new Error(`no width share found for ${name}`);
  return Number(match[1]);
}
/** The row of round ticks, and one of them. */
const Meter = /\.Root\s*\{([^}]*)\}/;
const Mark = /\.Mark\s*\{([^}]*)\}/;
const Spent = /\.Spent\s*\{([^}]*)\}/;
/** The row, which is where the cap on how wide the bank gets lives. */
const Root = /\.Root\s*\{([^}]*)\}/;
/** One card's slot, which is where the card's shape is declared. */
const Slot = /\.Slot\s*\{([^}]*)\}/;
/** The card itself, and what is layered on it. */
const Card = /\.Root\s*\{([^}]*)\}/;
const CardMark = /\.Mark\s*\{([^}]*)\}/;
const Initial = /\.Initial\s*\{([^}]*)\}/;
const InitialHover = /\.Root:hover \.Initial\s*\{([^}]*)\}/;
const Noise = /\.Noise\s*\{([^}]*)\}/;
const Name = /\.Name\s*\{([^}]*)\}/;
describe('the row of theme cards', () => {
  it('wraps into rows of three rather than scrolling sideways', () => {
    // A bank the player has to swipe is a bank they never see whole, so the row wraps instead
    // and the cap is what makes it three and three rather than four and two.
    expect(sheet.declaration(Root, 'flex-wrap')).toBe('wrap');
    expect(sheet.declaration(Root, 'gap')).toBe('var(--Space-ThemeCardsGap)');
    expect(sheet.declaration(Root, 'max-width')).toBe('var(--Layout-ThemeCardsMaxWidth)');
  });
  it('is three cards across or two, decided by the card width rather than a width query', () => {
    // A card count is not something a `calc()` can hold, but the count a row ends up with is
    // only ever a consequence of how wide the card is. So the width is the smaller of what two
    // across would allow and what three across would allow, and the row is whatever that leaves
    // room for -- which is why there is no query over the row and no second copy of the card.
    //
    // The smaller of the two rather than always the three: below about five hundred pixels the
    // three-across card is around a hundred and forty wide, and a theme name cut to three
    // letters on every one of six cards is not a choice anybody can make.
    expect(tokenValue('--Size-ThemeCardWidth').replace(/\s+/g, '')).toBe(
      'min(320px,min(calc((100vw-var(--Space-ThemeCardsGap)-2*var(--Layout-ScreenPaddingHorizontal))/2),' +
        'max(var(--Size-ThemeCardWidthThreeAcross),' +
          'calc((100vw-2*var(--Space-ThemeCardsGap)-2*var(--Layout-ScreenPaddingHorizontal))/3))))',
    );
const gap = narrowestGap();
    const margin = Number(tokenValue('--Layout-ScreenPaddingHorizontal').replace('px', ''));
    const worthThree = Number(tokenValue('--Size-ThemeCardWidthThreeAcross').replace('px', ''));
    for (const screen of [254, 340, 375, 400, 500, 667, 1024]) {
      const room = screen - 2 * margin;
      const two = (room - gap) / 2;
      const three = (room - 2 * gap) / 3;
      const width = Math.min(320, Math.min(two, Math.max(worthThree, three)));
      // A card is never wider than two across would allow and never wider than the cap, so the
      // row always has two of them in it and only ever takes a third where three fit. The
      // three-across floor is what makes a third column give up first on a narrow screen, which
      // is the point of it: a card stays readable rather than shrinking to make room for a third.
      expect(width).toBeLessThanOrEqual(two);
      expect(2 * width + gap <= room).toBe(true);
    }
  });

  it('takes the row cap with it when the card width changes', () => {
    // The cap is three widths and two gaps rather than a length, so a card that narrows on a
    // phone takes its cap with it. Without this the row would keep a desktop's cap while its
    // cards were phone-sized, and the fourth card would land wherever the arithmetic left it.
    expect(tokenValue('--Layout-ThemeCardsMaxWidth').replace(/\s+/g, '')).toBe(
      'calc(3*var(--Size-ThemeCardWidth)+2*var(--Space-ThemeCardsGap))',
    );
  });
  it('cuts a name that will not fit rather than wrapping it onto two lines', () => {
    // A wrap is a second line on the cards that need one and not on the cards that do not: a
    // bank where one word is on two lines and the five beside it are on one has its middle in
    // the wrong place, and the name and the row of rounds stop being a centred pair.
    expect(card.text).toContain('Truncate from');
    expect(card.declares(Name, 'white-space')).toBe(false);
    expect(card.declares(Name, 'text-overflow')).toBe(false);
  });
  it('shortens a card so both rows of the bank are on a short screen', () => {
    // A card is as tall as its width says, so on a device turned on its side a bank of six is
    // taller than the window and the second row is off the bottom: half the themes on offer,
    // not on screen, on a screen wide enough to show three across. The slot's `max-height` is
    // the ceiling, and it keeps the width — a card that narrowed instead would be a card nobody
    // could read.
    //
    // The ceiling is for both rows, not for one. A flat share of a short screen is more than
    // half of what two rows can have, so the second row ran off the bottom at 667x375 and the
    // bank came to be drawn over the player bar. What is left after the page's own margins and
    // the one gap between two rows, divided by two, is the only height at which both fit.
    expect(sheet.declaration(Slot, 'max-height')).toBe('var(--Size-ThemeCardHeightMax)');
    const ceiling = tokenValue('--Size-ThemeCardHeightMax').replace(/\s+/g, '');
    expect(ceiling).toBe(
      'calc((100dvh-2*var(--Layout-ScreenPaddingVertical)-var(--Space-ThemeCardsGap))/2)',
    );
    // Two cards and the gap between them fit a landscape phone once each is held to that
    // ceiling, which is the whole claim. Checked against the largest margin the screen is allowed
    // to take rather than a fixed one: the margin is a clamp now, and a claim that holds only at
    // one end of a clamp holds on one screen.
    const screen = 375;
    const margin = Number(tokenValue('--Space-2xl').replace('px', ''));
    const ceilingAt = (screen - 2 * margin - narrowestGap()) / 2;
    expect(2 * ceilingAt + narrowestGap()).toBeLessThanOrEqual(screen - 2 * margin);
  });
  it('starts the rows where the row starts, so nothing can be drawn over the bar above', () => {
    // Centring the lines of a box shorter than its own content pushes the first line out
    // through the top of the box, which is where the player bar is. The gap between the rows is
    // the only thing that spaces them now.
    expect(sheet.declaration(Root, 'align-content')).toBe('start');
    expect(sheet.declaration(Root, 'align-items')).toBe('center');
  });
  it('gives every card the same width, so the six read as one bank', () => {
    // A card that grew to fill whatever room it had would be a slightly different size from
    // its neighbours, and six panels that do not match are not a bank.
    expect(sheet.declaration(Slot, 'flex')).toBe('00var(--Size-ThemeCardWidth)');
    expect(sheet.declaration(Slot, 'width')).toBe('var(--Size-ThemeCardWidth)');
  });
  it('takes the card shape from the slot, so the card knows nothing about its own size', () => {
    // The ratio is the grid's business and is declared on the node the grid owns; a card
    // taller or wider than the grid meant would be a card out of line with the five beside it.
    expect(sheet.declaration(Slot, 'aspect-ratio')).toBe('var(--Ratio-ThemeCard)');
    expect(card.declares(Name, 'height')).toBe(false);
  });
  it('lays the cards flat, with nothing turning them towards the middle of the screen', () => {
    // The row was a ring of panels and needed a measurement per card on every resize to keep
    // it; a card that has to be measured before it can be looked at is a card that is not read.
    expect(sheet.declares(Root, 'perspective')).toBe(false);
    expect(sheet.declares(Slot, 'transform')).toBe(false);
    expect(card.declares(Card, 'perspective')).toBe(false);
    expect(card.declares(Card, 'rotate')).toBe(false);
  });
});
describe('the theme cards', () => {
it('washes in the theme accent on hover, in the same time as every other control', () => {
    // The fill is the pale wash and the name and border take the tint в— the accent as the
    // game draws it everywhere else. The ink is the same hue turned down until text can sit
    // on that wash, and using it here made a hovered card a different colour from the rest of
    // the theme it belongs to.
    const hover = /\.Root:hover\s*\{([^}]*)\}/;
    // The wash and the step the card rests on are read from one property, so the hover writes the
    // property rather than the background: the panel behind the number is filled from the same
    // one, and a second declaration of the fill would be a second answer to what colour this card
    // is. The value it is given is the wash.
    expect(card.declaration(hover, 'background')).toBe('var(--ThemeCard-Surface)');
    expect(
      card.declaration(hover, '--ThemeCard-Surface').replace(/\s+/g, ''),
    ).toBe('var(--ThemeCard-Wash,var(--Accent-Wash))');
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
    // Through the one property rather than straight to the step: the card at rest and the panel
    // behind the number read the same value, so a hover changes it in one place and the panel
    // follows instead of staying behind as a pale field on a wash.
    expect(card.declaration(Card, 'background')).toBe('var(--ThemeCard-Surface)');
    expect(card.declaration(Card, '--ThemeCard-Surface')).toBe('var(--Color-Surface-Hover)');
    expect(card.ruleBody(/\.Root:hover\s*\{([^}]*)\}/)).not.toContain('border');
  });
  it('draws the focus ring outside the fill, since there is no border to recolour', () => {
    // It used to recolour the card's own border, which kept a focused card from showing two
    // frames at once. With no frame the ring has to be drawn outside, and an outline does that
    // without taking any of the card's width в— a focused card that grew a pixel would be a card
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
it('crops the number at a panel of its own rather than at the edge of the card', () => {
    // A figure a third again as wide as the card, stopped by the card's own edge, reads as a
    // number painted to fit the card rather than as a number printed on something and cut by
    // its frame. The panel has margins of its own, and is set in less far than the card's
    // padding so the name and the row of rounds are not cropped along with the figure.
    //
    // A panel and not a ring drawn on the card: two edges on one flat colour is a card with
    // two borders on it, which is the one thing this card gave up its border to avoid. In the
    // card's own colour the panel is invisible as a surface, and it follows the hover rather
    // than staying behind as a pale field on a wash.
    const panel = /\.Panel\s*\{([^}]*)\}/;
    expect(card.declaration(panel, 'inset')).toBe('var(--Space-ThemeCardInset)');
    expect(card.declaration(panel, 'background')).toBe('var(--ThemeCard-Surface)');
    expect(card.declaration(panel, 'overflow')).toBe('hidden');
    expect(card.declaration(panel, 'pointer-events')).toBe('none');
    // The fill and the panel read one property, so there is a single answer to what colour this
    // card is and the hover changes it in one place.
    expect(card.declaration(Card, 'background')).toBe('var(--ThemeCard-Surface)');
    expect(
      card.declaration(/\.Root:hover\s*\{([^}]*)\}/, '--ThemeCard-Surface').replace(/\s+/g, ''),
    ).toBe('var(--ThemeCard-Wash,var(--Accent-Wash))');
    expect(widthShare('--Space-ThemeCardInset')).toBeLessThan(
      widthShare('--Space-ThemeCardPadding'),
    );
    // The card draws no second edge of its own.
    expect(card.text).not.toContain('.Root::after');
    // The panel is positioned and the row of rounds was not, so the panel painted over it and
    // the card came out with a word on it and no bar. The row of rounds is above the panel and
    // under the grain, which is the only order the three of them can be in.
    expect(Number(meter.declaration(Meter, 'z-index'))).toBeGreaterThan(
      Number(card.declaration(panel, 'z-index')),
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
    // cannot be a paler version of that hue в— it is grey and faint, which are two separate
    // things from the colour.
    expect(card.declaration(CardMark, 'opacity')).toBe('var(--Opacity-ThemeCardMark)');
  });
  it('is the card quiet grey at rest, and the theme tint under the pointer', () => {
    // Grey rather than a faded tint, and that is what makes it read as a number *behind* the
    // theme: a weaker tint is still the theme's own hue and competes with the ticks and the
    // name because it is their colour, while grey is the one colour nothing else on the card
    // is wearing. It was inheriting the card's quiet ink too, so the bank read as six grey
    // cards with six coloured strips в— the number is the biggest thing on a card and was the
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
it('snaps the mark open rather than easing it, and leaves the name to take its time', () => {
    // A figure cut off by the card's own frame, growing behind a frame that stays still, reads
    // as the crop being wrong rather than as the number opening up. The card is either being
    // pointed at or it is not, and the two states differ in one step.
    expect(card.declares(CardMark, 'transition')).toBe(false);
    expect(card.ruleBody(/\.Root:hover\s+\.Mark\s*\{([^}]*)\}/)).not.toContain('transition');
    // The name still eases: the word is what is being read, and a word that appears all at once
    // is a word that was somewhere else a moment ago.
    expect(card.declares(Name, 'transition')).toBe(true);
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
    // than once while this was being looked at в— the pale card defeats some of them в— so what
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
    // pressed в— an overlay that ate the pointer would make half the card dead.
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
    // them takes the room and leaves the other against an edge в— a growing name pinned the bar
    // to the bottom of the card with the word centred in whatever was left over, which read as
    // a centred name and a bottom-aligned bar rather than one thing read downwards.
    expect(card.declaration(Card, 'flex-direction')).toBe('column');
    expect(card.declaration(Card, 'justify-content')).toBe('center');
    expect(card.declaration(Name, 'flex')).toBe('00auto');
  });
  it('lets the card hold the gap to the name, rather than the bar holding a margin of its own', () => {
    // `margin-top: auto` would put the bar back at the bottom edge, and a negative top margin
    // centres the pair by its margin rather than by its box — which is how a word ends
    // up high on a card with its bar low and neither of them at the middle. One `gap` on the card
    // is the whole of it, and no width on the bar: stretching it across the card would put the
    // card's padding back into the centring.
    expect(card.declaration(Card, 'gap')).toBe('var(--Space-Xs)');
    expect(meter.declares(Meter, 'margin-top')).toBe(false);
    expect(meter.declares(Meter, 'width')).toBe(false);
  });
  it('insets the card once, rather than the name and the bar each holding their own', () => {
    // Two numbers saying one thing put the card's contents in by different amounts at the top
    // and the bottom, and left the word further from the frame than the row under it.
    expect(card.declaration(Card, 'padding')).toBe('var(--Space-ThemeCardPadding)');
    expect(card.declares(Name, 'padding')).toBe(false);
    expect(meter.declares(Meter, 'padding')).toBe(false);
  });
  it('centres the row rather than letting the card padding push it aside', () => {
    // The leftover width does not divide evenly between two cards of the same width в— a name
    // wrapping to two lines on one card and not the next leaves that card's row off to one
    // side, and a bank of six with rows at different places is not a bank.
    expect(meter.declaration(Meter, 'justify-content')).toBe('center');
  });
it('draws every tick in the theme accent, and greys the spent ones by opacity', () => {
    // The bar is one thing the card is saying в— this theme, this many rounds в— so every tick
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
    // ticks against whatever the page inherited в— the same marks a different width on the
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
    // At zero the longest word touches the edge, and the edge is the one part of a card that
    // is never looked at until something is in the way. A share of the width rather than a
    // length, so the inset holds at every card size: a flat padding is a quarter of a narrow
    // card, and a card with a quarter of itself in padding has no room for a name.
    expect(widthShare('--Space-ThemeCardPadding')).toBeGreaterThan(0);
    // At the widest card it is the padding this always had.
    expect(widthShare('--Space-ThemeCardPadding') * 320).toBeCloseTo(16, 5);
  });
  it('scales the whole card rather than crowding it, on a narrow screen', () => {
    // Everything drawn on the card is a share of the card's width — the name, the number behind
    // it, the letter in the corner, the row of rounds and the panel that crops it — so three
    // cards across a phone are three small cards, not three wide ones with less room in them.
    // One thing is not a share, and cannot be: the gap between cards, which the card's own
    // width is measured from. A share of the window has no such problem — a third of the gap at
    // the narrowest screen still tells two cards apart, where a fixed 16px there is a fifth of a
    // card and a row with more space between the cards than on them.
    expect(tokenValue('--Space-ThemeCardsGap').replace(/\s+/g, '')).toBe('clamp(6px,3vw,16px)');
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

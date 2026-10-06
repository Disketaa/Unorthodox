import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';
import { GameConfig } from '../Source/Game';
import { ThemeIds, dealThemes, createRandom, randomFor } from '../Source/Core';
/** The bank of theme cards, read from the stylesheet and the token file. Out here for the reason
 * `Tests/PlayerBarLayout.test.ts` is: happy-dom does not lay out a flex row, so a rendered
 * `ThemeCards` says nothing about how wide the bank gets or how many cards fit across it. */
const sheet = stylesheet('../Source/Design/Components/ThemeCards/ThemeCards.module.css');
const card = stylesheet('../Source/Design/Components/ThemeCard/ThemeCard.module.css');
const meter = stylesheet('../Source/Design/Components/RoundMeter/RoundMeter.module.css');
const tokens = readFileSync(
  new URL('../Source/Design/Tokens.css', import.meta.url),
  'utf8',
);
const tokenValue = tokenReader(tokens);
/** The gap between cards at the narrowest screen, which is the floor of its `clamp`. */
function narrowestGap(): number {
  const match = tokenValue('--Space-ThemeCardsGap').match(/clamp\(\s*([0-9.]+)px/);
  if (match?.[1] === undefined) throw new Error('no floor in the gap between cards');
  return Number(match[1]);
}
/** A token written as a share of the card's width, as the number it multiplies it by. Several
 * things drawn on a theme card are shares of one width rather than lengths, which is how a
 * narrow screen scales the card instead of crowding it. Read from the card rather than the
 * token file, since a share of a width the row decides can only be resolved where that width
 * is. */
function widthShare(name: string): number {
  const match = card.text.match(
    new RegExp(`${name}:\\s*calc\\(\\s*var\\(--Size-ThemeCardWidth\\)\\s*\\*\\s*([0-9.]+)\\s*\\)`, 'i'),
  );
  if (match?.[1] === undefined) throw new Error(`no width share found for ${name}`);
  return Number(match[1]);
}

/** The value of a custom property the card declares for itself, whitespace gone. */
function cardToken(name: string): string {
  const match = card.text.match(new RegExp(`${name}:\\s*([^;]+);`, 'i'));
  if (match?.[1] === undefined) throw new Error(`no ${name} on the card`);
  return match[1].replace(/\s+/g, '');
}
/** The row of round ticks, and one of them. */
const Meter = /\.Root\s*\{([^}]*)\}/;
const Mark = /\.Mark\s*\{([^}]*)\}/;
const Spent = /\.Spent\s*\{([^}]*)\}/;
/** The row, which is where the cap on how wide the bank gets lives. */
const Root = /\.Root\s*\{([^}]*)\}/;
/** One card's slot, which is where the card's shape is declared. */
const Slot = /\.Slot\s*\{([^}]*)\}/;
/** The card itself as the slot holds it, which is where the width is read. */
const SlotCard = /\.Slot > \*\s*\{([^}]*)\}/;
/** The card itself, and what is layered on it. */
const Card = /\.Root\s*\{([^}]*)\}/;
const CardMark = /\.Mark\s*\{([^}]*)\}/;
const Initial = /\.Initial\s*\{([^}]*)\}/;
const InitialHover = /\.Root:hover \.Initial\s*\{([^}]*)\}/;
const Noise = /\.Noise\s*\{([^}]*)\}/;
const Name = /\.Name\s*\{([^}]*)\}/;
describe('the row of theme cards', () => {
  it('fills the width it is given rather than sizing itself to its cards', () => {
    // A row of `1fr` tracks cannot measure itself: the tracks are fractions of the row, and the
    // row is as wide as the tracks. Inside a centred stack the row is measured from its contents
    // instead, there is nothing to divide, and the whole bank collapses to nothing.
    expect(sheet.declaration(Root, 'display')).toBe('grid');
    expect(sheet.declaration(Root, 'width')).toBe('100%');
    expect(sheet.declaration(Root, 'grid-template-columns')).toBe('repeat(2,minmax(0,1fr))');
  });
  it('gives every card the same width, so the six read as one bank', () => {
    // Equal tracks rather than each card taking a share of its content: six panels of different
    // sizes are not a bank, and a `1fr` track is the only way a grid says equal.
    expect(sheet.declaration(Root, 'grid-auto-rows')).toBe('minmax(0,1fr)');
    expect(sheet.declares(Root, 'flex-wrap')).toBe(false);
  });
  it('gives every row an equal share of the height, so the rows touch', () => {
    // A card shorter than its row and centred in it leaves the slack as a band between one row
    // and the next. `minmax(0, 1fr)` and not `auto`: the rows are sized to fill, not to measure.
    expect(sheet.declaration(Root, 'grid-auto-rows')).toBe('minmax(0,1fr)');
    expect(sheet.declaration(Slot, 'height')).toBe('100%');
  });
  it('is three, two or one across, and the count is a query over the cards', () => {
    // A card count is a choice between widths rather than a consequence of one: at every width
    // the card could be three-across-some-width or two-across-a-bigger-one, and which is wanted
    // is not a comparison `min()` and `max()` can make, since they move in opposite directions
    // as the window narrows. So each count is stated, about the cards and not the window.
    expect(sheet.flat).toContain('repeat(3,minmax(0,1fr))');
    expect(sheet.flat).toContain('grid-template-columns:minmax(0,1fr)');
  });
  it('restates each query threshold as a token, and one as a test', () => {
    // A query cannot hold a `var()`, so the literal has to be written out beside the token that
    // says what it means. Resolved here rather than trusted: a threshold that drifts from the
    // card width it was derived from is a threshold that no longer describes anything.
    for (const token of ['--Size-ThemeCardThreeAcrossWidth', '--Size-ThemeCardOneAcrossWidth']) {
      const literal = tokenValue(token).replace('px', '');
      expect(sheet.text).toContain(`width: ${literal}px`);
    }
  });
  it('gives up a column before a card is too narrow to read', () => {
    // The thresholds are where a card would cross `--Size-ThemeCardWidthMin`, not round numbers.
    // Under it a name is cut to nothing, which is the thing the count exists to avoid.
    const margin = Number(tokenValue('--Layout-ScreenPaddingHorizontal').replace('px', ''));
    const worth = Number(tokenValue('--Size-ThemeCardWidthMin').replace('px', ''));
    const threeAt = Number(tokenValue('--Size-ThemeCardThreeAcrossWidth').replace('px', ''));
    const oneAt = Number(tokenValue('--Size-ThemeCardOneAcrossWidth').replace('px', ''));
    const gap = narrowestGap();
    const two = (screen: number) => (screen - 2 * margin - gap) / 2;
    const three = (screen: number) => (screen - 2 * margin - 2 * gap) / 3;
    // Three across starts where the cards stay worth picking, not before it.
    expect(three(threeAt)).toBeGreaterThanOrEqual(worth);
    // One across starts where two would have fallen under it, so a narrow screen loses a column
    // rather than shrinking both its cards below what a name can be read at.
    expect(two(oneAt)).toBeLessThan(worth);
    // And in between, two across is the count that reads on a phone.
    expect(two(375)).toBeGreaterThanOrEqual(worth);
    expect(three(375)).toBeLessThan(worth);
  });
  it('holds the bank to three cards wide', () => {
    // The fourth would otherwise start a row of its own beside three, reading as a row of four
    // and a pair. A cap rather than a count, since the count is a query above.
    expect(sheet.declaration(Root, 'max-width')).toBe('var(--Layout-ThemeCardsMaxWidth)');
    expect(tokenValue('--Layout-ThemeCardsMaxWidth').replace(/\s+/g, '')).toBe(
      'calc(3*var(--Size-ThemeCardWidthMax)+2*var(--Space-ThemeCardsGap))',
    );
  });
  it('takes the height its parent has left, so six cards never scroll', () => {
    // A bank sized to its cards grows past the room under the player bar and scrolls, and half
    // the themes on offer end up below the fold. `min-height: 0` is half of it: a flex item's
    // floor is its own contents, and without it the bank cannot be smaller than six cards.
    expect(sheet.declaration(Root, 'flex')).toBe('11auto');
    expect(sheet.declaration(Root, 'min-height')).toBe('0');
  });
  it('sizes the card from the container it is in, and nowhere else', () => {
    // The card's width is what the row gave it, and the only way a card can read a width it was
    // not told is by asking the box that was given it. `inline-size` rather than `size`, because
    // two-dimensional containment makes a stretched `height: 100%` resolve against nothing.
    expect(sheet.declaration(Slot, 'container-type')).toBe('inline-size');
    expect(sheet.declaration(SlotCard, '--Size-ThemeCardWidth')).toBe('100cqw');
    expect(sheet.declares(Slot, '--Size-ThemeCardWidth')).toBe(false);
    expect(sheet.declares(Root, '--Size-ThemeCardWidth')).toBe(false);
  });
  it('puts the card own sizes on the card, since a share resolves where it is declared', () => {
    // A custom property''s value is substituted where it is declared, not where it is used: a
    // chain at the root resolves against whatever the width token holds there, and it holds
    // nothing, because the width is `100cqw` from inside the slot. At the root every one of
    // these was guaranteed-invalid and each element using one fell back to an inherited size —
    // the name at body size, the corner letter without its inset, the figure too small to see.
    expect(tokens).not.toContain('--FontSize-ThemeCard:');
    expect(tokens).not.toContain('--Space-ThemeCardPadding:');
    const shares: [string, string][] = [
      ['--FontSize-ThemeCard', '0.115'],
      ['--FontSize-ThemeCardMark', '1.45'],
      ['--FontSize-ThemeCardInitial', '0.0775'],
      ['--Space-ThemeCardPadding', '0.05'],
      ['--Space-ThemeCardInset', '0.025'],
    ];
    for (const [name, share] of shares) {
      expect(cardToken(name)).toBe(`calc(var(--Size-ThemeCardWidth)*${share})`);
    }
  });
  it('cuts a name that will not fit rather than wrapping it onto two lines', () => {
    // A wrap is a second line on the cards that need one and not on the cards that do not: a
    // bank where one word is on two lines and the five beside it are on one has its middle in
    // the wrong place, and the name and the row of rounds stop being a centred pair.
    expect(card.text).toContain('Truncate from');
    expect(card.declares(Name, 'white-space')).toBe(false);
    expect(card.declares(Name, 'text-overflow')).toBe(false);
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
    expect(card.text).toContain('var(--Transition-Standard)');
    expect(tokenValue('--Transition-Standard')).toBe(
      'var(--Duration-Fast) var(--Easing-Standard)',
    );
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
    expect(cardToken('--FontSize-ThemeCardInitial').replace(/\s+/g, '')).toBe(
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
      cardToken('--FontSize-ThemeCardMark').match(/[\d.]+/)?.[0],
    );
    const name = Number(cardToken('--FontSize-ThemeCard').match(/[\d.]+/)?.[0]);
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
    expect(card.ruleBody(Noise)).toContain('--Transition-Standard');
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
  it('names a theme large enough to be the content of a panel, not a caption on one', () => {
    // The only name in the game drawn as the whole content of a card rather than as a
    // heading over something, and a share of the card's width rather than a size of its
    // own: the card narrows on a phone, and a flat size would be a caption again there.
    const size = cardToken('--FontSize-ThemeCard').replace(/\s+/g, '');
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

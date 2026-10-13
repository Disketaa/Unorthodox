import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stylesheet, tokenReader } from './Stylesheet';

/** The board of answers, read from its stylesheet and the token file rather than rendered:
 * happy-dom does not lay out a grid, does not resolve a `minmax`, and does not answer a size
 * container, so a rendered board says nothing about how many cards fit across it or how big
 * each one is drawn. */
const sheet = stylesheet('../Source/Design/Components/AnswerCards/AnswerCards.module.css');
const card = stylesheet('../Source/Design/Components/AnswerCard/AnswerCard.module.css');
const tokens = readFileSync(new URL('../Source/Design/Tokens.css', import.meta.url), 'utf8');
const tokenValue = tokenReader(tokens);

const Root = /\.Root[^{]*\{([^}]*)\}/;
const Columns1 = /\.Columns1[^{]*\{([^}]*)\}/;
const Columns2 = /\.Columns2[^{]*\{([^}]*)\}/;
const Columns3 = /\.Columns3[^{]*\{([^}]*)\}/;
const Slot = /\.Slot[^{]*\{([^}]*)\}/;
const Filler = /\.Filler[^{]*\{([^}]*)\}/;
const Bar = /\.Root::-webkit-scrollbar[^{]*\{([^}]*)\}/;
const SlotCard = /\.Slot > \*[^{]*\{([^}]*)\}/;
const CardRoot = /\.Root[^{]*\{([^}]*)\}/;
const Answer = /\.Answer[^{]*\{([^}]*)\}/;
const Room = /\.Room[^{]*\{([^}]*)\}/;
const Mark = /\.Mark[^{]*\{([^}]*)\}/;
const Noise = /\.Noise[^{]*\{([^}]*)\}/;

/** A token written as a share of the card's width, as the number it multiplies it by. Several
 * things drawn on a card are shares of one width rather than lengths, which is how a narrow
 * screen scales the card instead of crowding it. Read off the card, since a share of a width
 * the board decides can only be resolved where that width is. */
function widthShare(name: string): number {
  const match = card.text.match(
    new RegExp(`${name}:\\s*calc\\(\\s*var\\(--Size-AnswerCardWidth\\)\\s*\\*\\s*([0-9.]+)\\s*\\)`, 'i'),
  );
  if (match?.[1] === undefined) throw new Error(`no width share found for ${name}`);
  return Number(match[1]);
}

describe('the board of answers', () => {
  it('is one, two or three across, and never four', () => {
    // The count is a choice between widths rather than a consequence of one, so it is stated: one
    // class per count the board is drawn at, and nothing beyond the third. A fourth column would
    // start a row of four beside three, reading as a strip and a pair rather than as one board.
    expect(sheet.declaration(Columns1, 'grid-template-columns')).toBe('minmax(0,1fr)');
    expect(sheet.declaration(Columns2, 'grid-template-columns')).toBe('repeat(2,minmax(0,1fr))');
    expect(sheet.declaration(Columns3, 'grid-template-columns')).toBe('repeat(3,minmax(0,1fr))');
    expect(sheet.flat).not.toContain('repeat(4');
  });

  it('fills the width it is given rather than sizing itself to its cards', () => {
    // A row of `1fr` tracks cannot measure itself: the tracks are fractions of the row and the
    // row is as wide as the tracks. Measured from its contents there is nothing to divide and
    // the whole board collapses.
    expect(sheet.declaration(Root, 'width')).toBe('100%');
    expect(sheet.declaration(Root, 'display')).toBe('grid');
  });

  it('gives every card the same share of both axes, so nine answers read as one board', () => {
    // Equal tracks rather than each card taking a share of its content: nine panels of different
    // sizes are not a board. Floored, so a row the room is short of becomes a scrolled board
    // rather than a card of twenty pixels with a word cut across it.
    expect(sheet.declaration(Root, 'grid-auto-rows')).toBe(
      'minmax(var(--Size-AnswerCardHeightMin),1fr)',
    );
    expect(sheet.declaration(Slot, 'height')).toBe('100%');
  });

  it('takes the height its parent has left, so nine answers never scroll', () => {
    // A board sized to its cards grows past the room under the player bar and scrolls, and half
    // the round ends up below the fold. `min-height: 0` is half of it: a flex item's floor is its
    // own contents, and without it the board cannot be smaller than nine cards.
    expect(sheet.declaration(Root, 'flex')).toBe('11auto');
    expect(sheet.declaration(Root, 'min-height')).toBe('0');
  });

  it('holds the board to three cards wide', () => {
    // The fourth would otherwise start a row of its own beside three. A cap rather than a count,
    // since the count is a class above.
    expect(sheet.declaration(Root, 'max-width')).toBe('var(--Layout-AnswerCardsMaxWidth)');
    expect(tokenValue('--Layout-AnswerCardsMaxWidth').replace(/\s+/g, '')).toBe(
      'calc(3*var(--Size-AnswerCardWidthMax)+2*var(--Space-AnswerCardsGap))',
    );
  });

  it('centres a part-filled row with empty cells rather than leaving it against the left', () => {
    // Four answers on three columns is two over one, and without a cell in the third column the
    // last card hangs off the left of the board instead of sitting under the middle of the row
    // above it. The board is drawn in render rather than by a query, since it is also the thing
    // drawing these cells and a query would move the columns without moving them.
    expect(sheet.declaration(Filler, 'pointer-events')).toBe('none');
    expect(sheet.declaration(Filler, 'min-height')).toBe('0');
  });

  it('draws no width query, since the count it would move is the one that counts these cells', () => {
    // The board measures its own width and decides in render. A query would move the columns
    // without moving the empty cells, and a part-filled row would centre on the wrong count.
    expect(sheet.text).not.toContain('@media');
    expect(tokens).not.toContain('--Size-AnswerCardsThreeAcrossWidth');
    expect(tokens).not.toContain('--Size-AnswerCardsOneAcrossWidth');
  });

  it('floors a row, caps itself against the window, and scrolls when the two disagree', () => {
    // A row must not become a strip too short to read, so it is floored; and the board must not
    // outgrow the screen above the player bar, so it is capped. Neither may the slot set the row's
    // height: a size container given an aspect ratio is a row sized to its contents again, which is
    // the four tall cards this board was written to avoid. The cap is the one measurement that
    // reaches the window, since `#root` is a `min-height` and the chain above has no height to
    // divide.
    const floor = Number(tokenValue('--Size-AnswerCardHeightMin').replace('px', ''));
    expect(floor).toBe(60);
    expect(sheet.declares(Slot, 'aspect-ratio')).toBe(false);
    expect(sheet.declaration(Slot, 'min-height')).toBe('0');
    expect(sheet.declaration(Root, 'max-height')).toBe('var(--Layout-AnswerCardsMaxHeight)');
    expect(tokenValue('--Layout-AnswerCardsMaxHeight')).toContain('100dvh');
    // The board scrolls rather than the page: the stage above already clips, and a page that
    // scrolled would take the player bar and the countdown off the screen with it.
    expect(sheet.declaration(Root, 'overflow-y')).toBe('auto');
    // And with no bar of its own. A card arrives through a squash that starts it over-tall, and a
    // scaled box extends the scrollable area, so the board genuinely overflows for as long as an
    // arrival runs and a bar would flash over the answers and then go again.
    expect(sheet.declaration(Root, 'scrollbar-width')).toBe('none');
    expect(sheet.declaration(Bar, 'width')).toBe('0');
    expect(sheet.declaration(Bar, 'height')).toBe('0');
  });

  it('sizes the card from the box it was given, on both axes', () => {
    // The card is not only as wide as its slot: twelve of them are short, and a card sized on
    // width alone puts an answer belonging on a wide panel onto one third of that height, which
    // overflows it and scrolls the page. Hence the two-dimensional container and the slot being
    // given its height rather than measuring it.
    expect(sheet.declaration(Slot, 'container-type')).toBe('size');
    expect(sheet.declaration(SlotCard, '--Size-AnswerCardWidth')).toBe('min(100cqw,100cqh*4/3)');
    expect(sheet.declares(Slot, '--Size-AnswerCardWidth')).toBe(false);
    expect(sheet.declares(Root, '--Size-AnswerCardWidth')).toBe(false);
  });
});

describe('an answer card', () => {
  it('scales the whole card rather than crowding it, on a narrow screen', () => {
    // Everything drawn on the card is a share of the card's width, so three cards across a phone
    // are three small cards rather than three wide ones with less room in them. The shares are
    // resolved on the card and not at the root, since a custom property substitutes where it is
    // declared and the root holds no width to resolve against.
    expect(tokens).not.toContain('--FontSize-AnswerCard:');
    // The share is of the card's width, multiplied by whatever the card has fitted itself to: the
    // size stays a property of the box, and only the reading of it is fitted to the words. Read on
    // the answer rather than declared as a token on the card, since a custom property substitutes
    // where it is declared: a fit written on the answer cannot reach a size the card resolved.
    expect(card.declaration(Answer, 'font-size')).toBe(
      'calc(var(--Size-AnswerCardWidth)*0.22*var(--AnswerCard-Fit,1))',
    );
    expect(widthShare('--Space-AnswerCardPadding')).toBeGreaterThan(0);
    expect(widthShare('--Space-AnswerCardInset')).toBeLessThan(widthShare('--Space-AnswerCardPadding'));
  });

  it('fits the writing into the card rather than cutting the end off an answer', () => {
    // A font size that fits its box is not expressible in CSS, so a card holding a word wider
    // than itself has three answers: wrap it, cut it, or measure it. Wrapping is already on the
    // card, so this is the third, and the only one where a player reads the whole answer. The
    // scale is a property rather than a size, so a fitted answer is still a share of the card.
    expect(card.text).toContain('--AnswerCard-Fit');
    expect(card.declaration(Answer, 'overflow')).toBe('hidden');
    // Filling the card rather than sized by its own text, which is what makes the measurement
    // possible at all: a box as tall as the text inside it can never overflow itself, so a long
    // answer would report itself as fitting and then be cut by the card's own edge.
    expect(card.declaration(Room, 'flex')).toBe('11auto');
    expect(card.declaration(Room, 'min-height')).toBe('0');
    expect(card.declaration(Room, 'height')).toBe('100%');
  });

  it('has no frame, and is one step off the page rather than white on it', () => {
    // The border and an off-white both lift a card off the page and a card this size does not
    // need both: with the frame gone the rounded corner and the fill are the whole edge.
    expect(card.declaration(CardRoot, 'border')).toBe('none');
    expect(card.declaration(CardRoot, 'background')).toBe('var(--AnswerCard-Surface)');
    expect(card.declaration(CardRoot, '--AnswerCard-Surface')).toBe('var(--Color-Surface-Hover)');
  });

  it('puts the count behind the answer rather than beside it', () => {
    // The answer is the card's substance and the count is context, so the count is a figure
    // cropped by the card and the answer is what is read on top of it. Taken out of the flow,
    // or it would take a line of the card and push the answer off its centre.
    expect(card.declaration(Mark, 'position')).toBe('absolute');
    // No track of its own: it is painted over the panel it is printed in and under the answer,
    // so the count is a figure behind a sentence rather than a third layer in the stack.
    expect(card.declares(Mark, 'z-index')).toBe(false);
    expect(card.declaration(Room, 'z-index')).toBe('1');
    expect(Number(card.declaration(Noise, 'z-index'))).toBeGreaterThan(
      Number(card.declaration(Room, 'z-index')),
    );
  });

  it('holds the count well back, since it is context and not the card’s subject', () => {
    // A figure of one behind every unique answer is a number that says nothing, so the card only
    // draws a count when more than one player wrote it. What it does draw is faint: the answer is
    // the thing being read and a count at reading strength would compete with it.
    const mark = Number(tokenValue('--Opacity-AnswerCardMark'));
    expect(mark).toBeGreaterThan(0);
    expect(mark).toBeLessThan(0.2);
  });

  it('wraps an answer rather than cutting it, and clips it at the card rather than over it', () => {
    // Wrapping is the point: a cut answer is a hidden answer, and this is the one place a
    // sentence is allowed onto two lines. `Truncate` is deliberately not composed in, since it
    // carries `white-space: nowrap` and a composed class lands after this one in the built
    // stylesheet, which is how an answer came to be unable to wrap at all.
    expect(card.text).not.toContain('Truncate from');
    expect(card.declaration(Answer, 'min-width')).toBe('0');
    expect(card.declaration(Answer, 'white-space')).toBe('normal');
    expect(card.declaration(Answer, 'overflow')).toBe('hidden');
    expect(card.declaration(Answer, 'overflow-wrap')).toBe('break-word');
    // Clipped rather than left to run on, because a card that cannot hold what was written on it
    // has to stop at its own edge instead of printing over the card beside it.
    expect(card.declaration(CardRoot, 'overflow')).toBe('hidden');
  });

  it('gives the answer its own width inside the room that centres it', () => {
    // The writing is centred by a flex box and nothing else is. Left as bare text in that box it
    // becomes an anonymous flex item sized to its longest line, and a word wider than the card
    // can never wrap: there is nothing telling it how wide it is.
    expect(card.declaration(Room, 'display')).toBe('flex');
    expect(card.declaration(Room, 'align-items')).toBe('center');
    expect(card.declaration(Answer, 'width')).toBe('100%');
    expect(card.declaration(Answer, 'display')).toBe('block');
  });

  it('lays the same grain over the card the theme cards are printed on', () => {
    // A noise tile at any opacity below one is a grey wash unless it is blended, since the tile
    // has grey in its light parts as well as its dark, and reducing it averages it to flat grey
    // before the browser blends anything. One tile for the whole game, so an answer board and a
    // bank of themes are both paper rather than one of them being printed on something else.
    expect(card.declaration(Noise, 'background-image')).toBe('var(--Texture-ThemeCardNoise)');
    expect(card.declaration(Noise, 'mix-blend-mode')).toBe('var(--Blend-ThemeCardNoise)');
    expect(card.declares(Noise, 'background-size')).toBe(false);
    expect(Number(card.declaration(Noise, 'z-index'))).toBeGreaterThan(
      Number(card.declaration(Room, 'z-index')),
    );
  });

  it('strikes out a muted answer rather than only holding it back', () => {
    // Held back and struck, since the mute is the host's judgement and the room is shown it
    // rather than left to work out why a card is quiet. This held the other way round while
    // muting was one player's vote, where a strike would have said more than the vote was worth.
    expect(card.declaration(/\.Voted\s*\{([^}]*)\}/, 'opacity')).toBe('var(--Opacity-AnswerCardVoted)');
    expect(card.ruleBody(/\.Voted \.Answer\s*\{([^}]*)\}/)).toContain('line-through');
  });

  it('strikes the writing and not the card', () => {
    // `text-decoration` is drawn by the element that owns the glyphs, so on the card it would sit
    // outside the answer altogether. It is also the only decoration here that changes how the
    // writing looks, and a muted card has to keep its own text readable underneath it.
    expect(card.ruleBody(/\.Answer\s*\{([^}]*)\}/)).not.toContain('line-through');
    expect(card.ruleBody(/\.Root\s*\{([^}]*)\}/)).not.toContain('line-through');
  });
});

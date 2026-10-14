import { GameConfig } from './GameConfig';
import type { Pace } from './GameConfig';

/** What one card of the board needs the room to be given, for an answer this many people wrote.
 * Not just the writing: the hold before anyone is named, every writer landing in turn, and the
 * beat before the room is offered a like. A card's content is the longest of the two — the typing
 * and the naming of writers — because they run one after the other rather than alongside each
 * other, and one writer is the short case: there is only ever a first face, so a card nobody
 * shared is just the hold and the beat before the like. */
export function cardRevealMs(writerCount: number): number {
  const timing = GameConfig.timing;
  return Math.max(
    timing.revealWriteMaxMs,
    timing.revealAuthorsMs + lastWriterMs(writerCount) + timing.revealLikeMs
  );
}

/** How long after one answer comes the next, for a board shaped like this: one number per card,
 * being how many people wrote that answer. The game's own beat, taken from the largest thing on
 * the board rather than from the board's size alone — a card eleven people agreed on needs nearly
 * twice what a card nobody shared needs, and a beat sized for the average of those overruns the
 * one card the room is actually waiting on.
 *
 * Shortened when there are more answers than the phase has time for: a full room's board still
 * has to be up before the phase ends, and the run is what is given up, never the voting time.
 * What is never given up is the floor, so on a board too big for its round the run overruns the
 * spare time instead — which is loud rather than quiet, where a card's like arriving on top of
 * the next card's writing is only something the room notices by having read the wrong answer. */
export function answerRevealBeat(
  writerCounts: readonly number[],
  durationMs: number,
  voteMs = GameConfig.timing.revealVoteMs
): number {
  let needed = 0;
  for (const writers of writerCounts) needed = Math.max(needed, cardRevealMs(writers));
  const spendable = Math.max(0, durationMs - voteMs);
  const perCard = spendable / Math.max(1, writerCounts.length - 1);
  return Math.max(needed, Math.min(GameConfig.timing.revealCardMs, perCard));
}

/** How long the reviewing round runs for a room of this many.
 *
 * This is what makes the round depend on the room rather than on nothing. A figure per room size
 * is not an option: a board of four answers turned over in fifteen seconds did not then get
 * seventy-five seconds of voting out of the difference — it got a finished board and a countdown,
 * which is the one thing a party game cannot sell a next round on. So the round is a floor for
 * being in the room at all — five seconds briskly, ten slowly — and five seconds for every player
 * after the first. The paces differ only in that floor: what Normal buys is a settled start before
 * anything is asked of the room, and not a slower count of the room itself.
 *
 * On the players rather than on the answers, which are not known until the round is over and are
 * not even fixed then: two people writing the same thing is one card instead of two, and a round
 * timed on the cards would shorten itself by exactly the moment the room enjoyed most. The people
 * in the room are what was agreed to at the table, and that is what the wait is for.
 *
 * Nothing is rounded to a step here. The figures come out whole under the brisk pace and in half
 * seconds under the slower one, and both are numbers a host can read off the card without
 * rounding them on the way out. */
export function reviewingDurationMs(players: number, pace: Pace): number {
  const { decidingBaseMs, decidingPerPlayerMs } = GameConfig.paces[pace];
  return decidingBaseMs + decidingPerPlayerMs * Math.max(0, players - 1);
}

/** How many of the round's answers are up at a moment counted from the host's start of the
 * phase. So every screen in the room turns the same card at the same moment, and the next round
 * deals the board face down again. */
export function revealedCount(
  writerCounts: readonly number[],
  durationMs: number,
  startedAt: number,
  now: number,
  voteMs = GameConfig.timing.revealVoteMs
): number {
  const count = writerCounts.length;
  if (count <= 0) return 0;
  const beat = answerRevealBeat(writerCounts, durationMs, voteMs);
  const since = now - startedAt - GameConfig.timing.revealLeadInMs;
  if (since <= 0) return 0;
  return Math.min(count, Math.floor(since / beat) + 1);
}

/** How long this answer takes to be written out: a rate per letter, held between a floor and a
 * ceiling. The floor stops a three-letter answer arriving in one frame; the ceiling stops a
 * sentence still arriving after the next card has opened. */

export function answerWriteMs(length: number): number {
  const timing = GameConfig.timing;
  const typed = length * timing.revealLetterMs;
  return Math.min(timing.revealWriteMaxMs, Math.max(timing.revealWriteMinMs, typed));
}

/** How much of one answer has been written out, over `writeMs` from the moment its own card came
 * up. Quick against the card's own beat: the rest of the beat is the room reading the answer,
 * and an answer still arriving when the next card opens is one nobody has read. */
export function revealedLetterCount(
  length: number,
  elapsedMs: number,
  writeMs: number
): number {
  if (length <= 0) return 0;
  if (elapsedMs <= 0) return 0;
  const written = Math.floor((elapsedMs / writeMs) * length);
  return Math.min(length, written);
}

/** The answer as far as it has been written, which is the whole of it by the time the card is
 * up. Cut mid-letter rather than at a word: the room is reading a card being typed at it, and a
 * half-drawn word is where a sentence being written is most legible. */
export function typedOut(text: string, shown: number): string {
  return text.slice(0, Math.min(text.length, Math.max(0, shown)));
}

/** Whether the room has been told who wrote this answer yet. Off for the first stretch of the
 * card's own beat and on for the rest of it, so a card says what it says before it says who
 * agreed with it. */
export function authorsArrived(elapsedMs: number): boolean {
  return elapsedMs >= GameConfig.timing.revealAuthorsMs;
}

/** How long the room waits before the first writer of an answer is joined by the second. Long on
 * purpose: two people writing the same thing is the moment the round is about, and the beat before
 * the second face lands is what makes it one rather than a fact. */
export const SecondWriterMs = 760;

/** How long each writer after the second takes. The same short beat for the third and the tenth,
 * since a room should not sit through eight pauses to be told the same thing again. */
export const FurtherWriterMs = 130;

/** When one writer of an answer is joined by the next, in milliseconds from the moment the room is
 * told who wrote it. The first is immediate, the second waits the dramatic beat, and every one after
 * it takes a short one — so a card ten people wrote still finishes inside a couple of seconds.
 *
 * Here rather than with the card that draws it, because two things have to land on the same frame
 * and only one of them is on the board: the card's own figures, and the bar's seats going off with
 * it. A second schedule beside this one would drift, and the room would watch a face arrive while
 * the bar still said its owner was safe. */
export function writerDelayMs(index: number): number {
  if (index <= 0) return 0;
  if (index === 1) return SecondWriterMs;
  return SecondWriterMs + (index - 1) * FurtherWriterMs;
}

/** How many of an answer's writers have landed, out of how many wrote it. The count and not a
 * boolean, since the figure behind the answer counts up one face at a time and a card struck out
 * takes its players off the bar one at a time. */
export function landedWriters(elapsedMs: number, total: number): number {
  if (elapsedMs < 0) return 0;
  let landed = 0;
  for (let writer = 0; writer < total; writer += 1) {
    if (elapsedMs >= writerDelayMs(writer)) landed = writer + 1;
    else break;
  }
  return landed;
}

/** When the last of an answer's writers lands, in milliseconds from the moment they started
 * arriving. Zero for a card nobody shared: there is only ever a first face. */
function lastWriterMs(total: number): number {
  return writerDelayMs(Math.max(0, total - 1));
}

/** Whether the room is yet offered a like on this answer, measured from the moment its writers
 * started arriving. A beat past the last face, rather than on it: the card says what it has to say,
 * and only then does the room get to answer it. */
export function likesOffered(elapsedMs: number, total: number): boolean {
  return elapsedMs >= lastWriterMs(total) + GameConfig.timing.revealLikeMs;
}

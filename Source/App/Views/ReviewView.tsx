import { ReviewScreen, ReviewGroup } from '@/Screens';
import { Strings } from '@/Content';
import { typedOut, type PublicReviewingState, type PublicScoresState } from '@/Game';
import type { PlayerId } from '@/Core';
import { useReveal, type RevealState } from '../Hooks/UseReveal';
import { countBoard } from '../Hooks/CountBoard';
import { PhaseViewProps } from './LobbyView';
import type { AnswerAuthor } from '@/Design/Components';
import type { GameSessionView } from '../Hooks/UseGameSession';

/** The board, from whichever half of the round is on screen. Both carry the same cards, and the
 * round counted is the round still being looked at rather than a different screen of totals. */
type BoardPublic = PublicReviewingState | PublicScoresState;

/** Reviewing: the room's answers on a board, and a card of its own for anybody who wrote
 * nothing. The sentence on a blank card comes from here rather than from the game, which knows
 * only that the card is empty. Only the host is handed a way to mute. */
export function ReviewView({ view }: PhaseViewProps) {
  const state = reviewBoard(view.publicState);
  const settling = view.publicState?.phase === 'Scores';
  const reveal = useReveal(
    state?.groups.map((group) => group.playerIds.length) ?? [],
    state?.pace ?? 'Standard',
    view.durationMs,
    view.phaseStartedAt,
    state !== undefined,
    view.paused,
    view.pausedAt,
    settling
  );
  const board = countBoard(settling, view.phaseStartedAt, reveal.moment);
  // The dark over the rest of the board, for as long as there is a card left to pay. The count
  // walks past the last card, so the veil has to stop with it: a dark over a finished count is a
  // dark over every figure the room is trying to read.
  const counting =
    board.payingIndex !== undefined && board.payingIndex < (state?.groups.length ?? 0);
  return (
    <ReviewScreen
      topic={state?.topic ?? ''}
      groups={reviewGroups(state, view, reveal)}
      revealed={reveal.upTo}
      payingIndex={board.payingIndex}
      spotlight={counting}
      inert={settling || view.paused === true}
      payingElapsedMs={board.payingElapsedMs}
      paused={view.paused}
      run={state?.reloadedAt ?? 0}
      onReject={view.isHost && !settling ? view.rejectGroup : undefined}
      onLike={view.paused || settling ? undefined : view.likeGroup}
    />
  );
}

/** The board's own half of the round, whichever of the two is on screen. */
function reviewBoard(state: GameSessionView['publicState']): BoardPublic | undefined {
  return state?.phase === 'Reviewing' || state?.phase === 'Scores' ? state : undefined;
}

/** The board as the screen draws it: who wrote each card, how much of it has been written out,
 * and what the room is allowed to do to it. Blank apart for the two sentences and the roster,
 * since this is a mapping and not a decision. */
function reviewGroups(
  state: BoardPublic | undefined,
  view: GameSessionView,
  reveal: RevealState
): ReviewGroup[] {
  // Who is on which card, resolved off the roster the state already carries: the wire sends ids
  // because ids are what the host has, and the faces and the names live with them. A player who
  // left between answering and this broadcast is drawn by nobody, which is right.
  const roster = new Map(state?.players.map((player) => [player.id, player]) ?? []);
  return (
    state?.groups.map((group, index) => {
      // A blank card is written out like any other, on the same beat and to the same length: a
      // word already sitting there while its neighbours were typed at would be the one card
      // nobody watched turn over.
      const text = group.isEmpty ? Strings.reviewing.blank : group.text;
      const authors = authorsOn(group.playerIds, roster);
      // Read off the card's own writers, not out of what this browser remembers sending: the board
      // already carries who wrote each card in `playerIds` and cannot go stale. The remembered
      // string could and did, so an answer reaching the board by another path came back grey.
      const wroteThis = view.playerId !== null && group.playerIds.includes(view.playerId);
      return {
        groupId: group.groupId,
        text: typedOut(text, reveal.shownAt(index, text.length)),
        playerCount: group.playerCount,
        voted: view.rejectedGroupIds.has(group.groupId),
        isEmpty: group.isEmpty,
        likes: view.likedGroupIds.get(group.groupId) ?? 0,
        liked: view.myLikedGroupIds.has(group.groupId),
        own: !group.isEmpty && wroteThis,
        authors,
        writerDelays: authors.map((_, seat) => reveal.writerDelayAt(seat)),
        authorsShown: reveal.authorsAt(index),
        landed: reveal.landedAt(index, authors.length),
        revealed: reveal.likesAt(index, authors.length),
        // What the card paid, when the room has been told. Carried off the group rather than
        // worked out here: the host ran the count and this screen has no answers left to work it
        // from. Left out before the count reaches the card, so it stays drawn as an answer.
        score: group.score,
        // Whether the round's enchanted card reached one of this card's writers, which is what the
        // card wears the shine for. Read off the round's list of who the enchantment reached,
        // intersected with the writers: a mult nobody was enchanted for is not the enchantment's.
        enchanted: enchantedSome(state, group.playerIds),
        ownPlayerId: view.playerId,
      };
    }) ?? []
  );
}

/** Whether the round's enchanted card reached anybody who wrote this answer. One shared answer
 * can have one writer reached and another not, and it is then the enchantment's doing: the
 * multiplier it adds is on the card because of one of the people on it. */
function enchantedSome(
  state: BoardPublic | undefined,
  playerIds: readonly PlayerId[]
): boolean {
  const reached = new Set(state?.affectedPlayerIds ?? []);
  return playerIds.some((id) => reached.has(id));
}

/** The writers on a card, as the card draws them: the same face and name as the roster chip, so
 * a seat nobody is in the room for is drawn by nobody. */
function authorsOn(
  playerIds: readonly PlayerId[],
  roster: ReadonlyMap<
    PlayerId,
    {
      name: string;
      look: { character: AnswerAuthor['character']; color: AnswerAuthor['color'] };
    }
  >
): AnswerAuthor[] {
  return playerIds.flatMap((id) => {
    const player = roster.get(id);
    return player === undefined
      ? []
      : [
          {
            id,
            name: player.name,
            character: player.look.character,
            color: player.look.color,
          },
        ];
  });
}

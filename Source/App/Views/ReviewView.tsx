import { ReviewScreen, ReviewGroup } from '@/Screens';
import { Strings } from '@/Content';
import { typedOut, type PublicReviewingState } from '@/Game';
import type { PlayerId } from '@/Core';
import { useReveal, type RevealState } from '../Hooks/UseReveal';
import { PhaseViewProps } from './LobbyView';
import type { AnswerAuthor } from '@/Design/Components';
import type { GameSessionView } from '../Hooks/UseGameSession';

/** Reviewing: the room's answers on a board, and a card of its own for anybody who wrote
 * nothing. The sentence on a blank card comes from here rather than from the game, which knows
 * only that the card is empty. Only the host is handed a way to mute. */
export function ReviewView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const reveal = useReveal(
    state?.groups.map((group) => group.playerIds.length) ?? [],
    state?.pace ?? 'Standard',
    view.durationMs,
    view.phaseStartedAt,
    state !== undefined,
    view.paused,
    view.pausedAt
  );
  return (
    <ReviewScreen
      topic={state?.topic ?? ''}
      groups={reviewGroups(state, view, reveal)}
      revealed={reveal.upTo}
      onReject={view.isHost ? view.rejectGroup : undefined}
      onLike={view.paused ? undefined : view.likeGroup}
    />
  );
}

/** The board as the screen draws it: who wrote each card, how much of it has been written out,
 * and what the room is allowed to do to it. Blank apart for the two sentences and the roster,
 * since this is a mapping and not a decision. */
function reviewGroups(
  state: PublicReviewingState | undefined,
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
        ownPlayerId: view.playerId,
      };
    }) ?? []
  );
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

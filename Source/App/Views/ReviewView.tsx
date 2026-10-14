import { ReviewScreen, ReviewGroup } from '@/Screens';
import { Strings } from '@/Content';
import { typedOut } from '@/Game';
import { createLogger } from '@/Core';
import { useEffect } from 'preact/hooks';
import { useReveal } from '../Hooks/UseReveal';
import { PhaseViewProps } from './LobbyView';
import type { AnswerAuthor } from '@/Design/Components';

const log = createLogger('ReviewView');

/** Reviewing: the room's answers on a board, and a card of its own for anybody who wrote
 * nothing. The sentence on a blank card comes from here rather than from the game, which knows
 * only that the card is empty. Only the host is handed a way to mute. */
export function ReviewView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const round = state !== undefined;
  const reveal = useReveal(
    state?.groups.map((group) => group.playerIds.length) ?? [],
    state?.pace ?? 'Standard',
    view.durationMs,
    view.phaseStartedAt,
    round,
    view.paused,
    view.pausedAt
  );
  // Who is on which card, resolved off the roster the state already carries rather than off a
  // lookup of its own: the wire sends ids because ids are what the host has, and the faces and
  // the names live with them. A player who left between answering and this broadcast is drawn by
  // nobody, which is right: a chip for a seat that is no longer there would be a ghost.
  const roster = new Map(state?.players.map((player) => [player.id, player]) ?? []);
  const groups: ReviewGroup[] =
    state?.groups.map((group, index) => {
      // A blank card is written out like any other, on the same beat and to the same length: a
      // word already sitting there while its neighbours were typed at would be the one card
      // nobody watched turn over.
      const text = group.isEmpty ? Strings.reviewing.blank : group.text;
      // Read off the answer as it was sent rather than as it is being written out: a half-written
      // card matches no answer at all, so a player mid-reveal would be offered a like on their
      // own. A blank is nobody's own and nobody may like it, being a record of an empty seat.
      const own = !group.isEmpty && view.wroteAnswer(group.text);
      const authors: AnswerAuthor[] = group.playerIds.flatMap((playerId) => {
        const player = roster.get(playerId);
        return player === undefined
          ? []
          : [
              {
                id: playerId,
                name: player.name,
                character: player.look.character,
                color: player.look.color,
              },
            ];
      });
      return {
        groupId: group.groupId,
        text: typedOut(text, reveal.shownAt(index, text.length)),
        playerCount: group.playerCount,
        voted: view.rejectedGroupIds.has(group.groupId),
        isEmpty: group.isEmpty,
        likes: view.likedGroupIds.get(group.groupId) ?? 0,
        liked: view.myLikedGroupIds.has(group.groupId),
        own,
        authors,
        authorsShown: reveal.authorsAt(index),
        landed: reveal.landedAt(index, authors.length),
        revealed: reveal.likesAt(index, authors.length),
        ownPlayerId: view.playerId,
      };
    }) ?? [];

  // Temporary: what the wire actually sent, so a board with no faces on it can be told apart from
  // a board whose faces were never drawn.
  useEffect(() => {
    log(
      'info',
      `groups=${state?.groups.length ?? 0} players=${state?.players.length ?? 0} ids=${(
        state?.groups ?? []
      )
        .map((group) => group.playerIds.length)
        .join(',')}`
    );
  }, [state]);

  return (
    <ReviewScreen
      topic={state?.topic ?? ''}
      groups={groups}
      revealed={reveal.upTo}
      onReject={view.isHost ? view.rejectGroup : undefined}
      onLike={view.paused ? undefined : view.likeGroup}
    />
  );
}

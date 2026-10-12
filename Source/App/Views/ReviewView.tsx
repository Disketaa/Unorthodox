import { ReviewScreen, ReviewGroup } from '@/Screens';
import { Strings } from '@/Content';
import { typedOut } from '@/Game';
import { useReveal } from '../Hooks/UseReveal';
import { PhaseViewProps } from './LobbyView';

/** Reviewing: the room's answers on a board, with a reject vote per answer and a card of its own
 * for anybody who wrote nothing. The sentence on a blank card comes from here rather than from
 * the game, which knows only that the card is empty. */
export function ReviewView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const round = state !== undefined;
  const reveal = useReveal(
    state?.groups.length ?? 0,
    view.durationMs,
    view.phaseStartedAt,
    round,
    view.paused,
    view.pausedAt
  );
  const groups: ReviewGroup[] =
    state?.groups.map((group, index) => {
      // A blank card is written out like any other, on the same beat and to the same length: a
      // word already sitting there while its neighbours were typed at would be the one card
      // nobody watched turn over.
      const text = group.isEmpty ? Strings.reviewing.blank : group.text;
      return {
        groupId: group.groupId,
        text: typedOut(text, reveal.shownAt(index, text.length)),
        playerCount: group.playerCount,
        voted: view.rejectedGroupIds.has(group.groupId),
        isEmpty: group.isEmpty,
      };
    }) ?? [];

  return (
    <ReviewScreen
      topic={state?.topic ?? ''}
      groups={groups}
      revealed={reveal.upTo}
      onReject={view.rejectGroup}
    />
  );
}

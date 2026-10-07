import { ReviewScreen, ReviewGroup } from '@/Screens';
import { PhaseViewProps } from './LobbyView';

/** Reviewing: grouped answers with a reject vote per group. */
export function ReviewView({ view }: PhaseViewProps) {
  const state = view.publicState?.phase === 'Reviewing' ? view.publicState : undefined;
  const groups: ReviewGroup[] =
    state?.groups.map((group) => ({
      groupId: group.groupId,
      text: group.text,
      playerCount: group.playerCount,
      voted: view.rejectedGroupIds.has(group.groupId),
    })) ?? [];

  return (
    <ReviewScreen
      topic={state?.topic ?? ''}
      groups={groups}
      onReject={view.rejectGroup}
    />
  );
}

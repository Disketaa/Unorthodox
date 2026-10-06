import { Banner } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import type { GameSessionView } from '../Hooks/UseGameSession';
import type { PhaseViewProps } from './LobbyView';

/** What the room is doing, in one sentence, at the very top of the game. The only thing here
 * that says what phase this is: the bank is the thing being done and the hexes are who is
 * playing it. In this browser's own voice, since choosing a theme is the point. */
function phaseMessage(view: GameSessionView, name: string): string {
  switch (view.phase) {
    case 'Writing':
      return view.hasSubmitted ? Strings.writing.waitForOthers : Strings.phase.choosingTheme(name);
    case 'Reviewing':
      return Strings.phase.reviewing;
    case 'Scores':
      return Strings.phase.scores;
    case 'Final':
      return Strings.phase.final;
    case 'Connecting':
      return Strings.phase.connecting;
    case 'Lobby':
      return Strings.lobby.waitingForHost;
  }
}

/** The note at the top of a game screen: what is happening, with the mark saying it still is.
 * The same block as the connecting screen, being the same situation seen during the game. No
 * line under it, so it does not read as progress: nothing here is measured. */
export function PhaseInfoView({ view }: PhaseViewProps) {
  // The name is the turn holder's rather than this browser's own, so the sentence reads the same
  // on every screen in the room: a player reading about somebody else is looking at the same
  // sentence as everybody else.
  const name = view.turnPlayerId === null ? '' : (view.playerNames.get(view.turnPlayerId) ?? '');
  return (
    <Stack align="Center">
      <Banner align="Center" mark="Loading">
        {phaseMessage(view, name)}
      </Banner>
    </Stack>
  );
}

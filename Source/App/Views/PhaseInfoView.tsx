import { Banner } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import type { GameSessionView } from '../Hooks/UseGameSession';
import type { PhaseViewProps } from './LobbyView';

/**
 * What the room is doing, in one sentence.
 *
 * The block above the theme bank, and the only thing on the screen that says what phase this is.
 * The bank below it is the thing being done and the player's own card says where they stand, so
 * this is the answer to the one question those two cannot answer: how long is this.
 *
 * The name is this browser's own, because the first thing a player does on this screen is choose
 * their theme, and a sentence about somebody else while they are the one choosing is one they have
 * to translate. Once an answer is in, the room is what the block is about instead.
 */
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

/**
 * The note at the top of a game screen: what is happening, with the mark that says it is still
 * happening.
 *
 * The same block the connecting screen is drawn in, in the same step of the palette, because it is
 * the same situation seen during the game rather than before it: something is on its way and one
 * sentence says so. A block with a line under it would be a progress figure, and there is nothing
 * to measure here — the phase's own clock is the host's, and this screen is about what the room is
 * doing rather than how long it has left.
 *
 * Only as wide as its sentence and centred, rather than stretched across the screen: a note that
 * spans the width says it is a section heading, and this is a sentence.
 */
export function PhaseInfoView({ view }: PhaseViewProps) {
  const name = view.playerId === null ? '' : (view.playerNames.get(view.playerId) ?? '');
  return (
    <Stack align="Center">
      <Banner align="Center" mark="Loading">
        {phaseMessage(view, name)}
      </Banner>
    </Stack>
  );
}
import { Banner, Timer } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { isTimedPhase } from '@/Game';
import { useCountdown } from '../Hooks/UseCountdown';
import type { SessionPhaseName } from '../Hooks/UseSessionPhase';
import type { PhaseViewProps } from './LobbyView';

/** What naming a phase takes: whose turn it is, and whether this player has answered. Every
 * phase the room can be in is a row, so a phase added elsewhere fails to compile here rather
 * than falling through to a sentence about a different moment. */
interface PhaseStory {
  turnName: string;
  hasSubmitted: boolean;
}

/** What the room is doing, in one sentence, at the very top of the game. In this browser's own
 * voice: a block reading about somebody else has to be translated by whoever is living it. */
const PhaseSentences: Record<SessionPhaseName, (story: PhaseStory) => string> = {
  Connecting: () => Strings.phase.connecting,
  Lobby: () => Strings.lobby.waitingForHost,
  Choosing: (story) => Strings.phase.choosingTheme(story.turnName),
  Writing: (story) =>
    story.hasSubmitted ? Strings.writing.waitForOthers : Strings.phase.writing,
  Reviewing: () => Strings.phase.reviewing,
  Scores: () => Strings.phase.scores,
  Final: () => Strings.phase.final,
};

/** The note at the top of a game screen: what is happening, with the mark saying it still is.
 * The countdown sits inside the block rather than above it, so a phase nobody waits out shows
 * the sentence alone and no bar that will never move. */
export function PhaseInfoView({ view }: PhaseViewProps) {
  // Unconditional: the hook is what ticks the countdown, so it runs whatever phase this is and
  // the clock is simply unused where nothing is measured.
  const remainingMs = useCountdown(
    view.durationMs,
    view.phaseStartedAt,
    view.clockOffsetMs,
  );
  const turnName =
    view.turnPlayerId === null ? '' : (view.playerNames.get(view.turnPlayerId) ?? '');
  const sentence = PhaseSentences[view.phase]({
    turnName,
    hasSubmitted: view.hasSubmitted,
  });

  return (
    <Stack align="Center" gap="Sm">
      <Banner align="Center" mark="Loading">
        {sentence}
      </Banner>
      {/* Connecting is not a game phase, so the table has no row for it and nothing is timed. */}
      {view.phase !== 'Connecting' && isTimedPhase(view.phase) && (
        <Timer remainingMs={remainingMs} totalMs={view.durationMs} />
      )}
    </Stack>
  );
}

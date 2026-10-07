import { Banner, Timer } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { GameConfig, isTimedPhase } from '@/Game';
import { accentFor } from '@/Core';
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
 * The countdown is drawn behind the sentence rather than under it, so a timed phase is one
 * block and a phase nobody waits out is the same block with no bar in it. */
export function PhaseInfoView({ view }: PhaseViewProps) {
  // Unconditional: the hook is what ticks the countdown, so it runs whatever phase this is and
  // the clock is simply unused where nothing is measured.
  const remainingMs = useCountdown(view.durationMs, view.phaseStartedAt, view.clockOffsetMs);
  const turnName =
    view.turnPlayerId === null ? '' : (view.playerNames.get(view.turnPlayerId) ?? '');
  const sentence = PhaseSentences[view.phase]({
    turnName,
    hasSubmitted: view.hasSubmitted,
  });
  // Connecting is not a game phase, so the table has no row for it and nothing is timed.
  const timed = view.phase !== 'Connecting' && isTimedPhase(view.phase);
  const secondsLeft = Math.ceil(remainingMs / 1000);
  // A step up per closing second, so the phase is heard running out in the beat already playing.
  const urgentSeconds = Math.ceil(GameConfig.timing.countdownUrgentMs / 1000);
  const beatSemitones =
    Math.max(0, urgentSeconds - secondsLeft) * GameConfig.timing.countdownPitchStepSemitones;
  // Off the shared roster rather than this browser's own look: a watcher sees the chooser's colour.
  const turnLook =
    view.phase === 'Choosing' ? view.playerLooks.get(view.turnPlayerId ?? '') : undefined;
  const tint = turnLook === undefined ? undefined : accentFor(turnLook.color).tint;

  return (
    <Stack align="Center" gap="Sm">
      {timed ? (
        <Timer
          remainingMs={remainingMs}
          totalMs={view.durationMs}
          seconds={Strings.common.secondsLeft(secondsLeft)}
          urgent={remainingMs <= GameConfig.timing.countdownUrgentMs}
          beatSemitones={beatSemitones}
          tint={tint}
        >
          {sentence}
        </Timer>
      ) : (
        <Banner align="Center" mark="Loading">
          {sentence}
        </Banner>
      )}
    </Stack>
  );
}

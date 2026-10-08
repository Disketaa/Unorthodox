import { Banner, Timer } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { GameConfig, isTimedPhase, questionRevealMs } from '@/Game';
import { accentFor } from '@/Core';
import { useCountdown } from '../Hooks/UseCountdown';
import { usePhaseAlarm } from '../Hooks/UsePhaseAlarm';
import type { SessionPhaseName } from '../Hooks/UseSessionPhase';
import type { GameSessionView } from '../Hooks/UseGameSession';
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

/** The clock the block at the top is counting, and how long it runs. The question is its own
 * clock rather than the bank's, since it is timed against its own length while the bank's
 * stopped the moment the theme was answered. */
function clockOf(view: GameSessionView): { remainingMs: number; totalMs: number } {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const question = choosing?.question;
  const totalMs = question === undefined ? view.durationMs : questionRevealMs(question);
  const startedAt = question === undefined ? view.phaseStartedAt : (choosing?.questionAt ?? 0);
  const answeredAt = question === undefined ? view.answeredAt : undefined;
  return {
    totalMs,
    remainingMs: useCountdown(
      totalMs,
      startedAt,
      view.clockOffsetMs,
      true,
      answeredAt,
      view.paused
    ),
  };
}

/** The colour the block is washed in: the chooser's own while a theme is being chosen, taken off
 * the shared roster rather than this browser's look, so a watcher sees the chooser's colour.
 * The question belongs to nobody, and takes the neutral blue. */
function tintOf(view: GameSessionView, reading: boolean): string | undefined {
  if (reading) {
    return accentFor('Sky').tint;
  }
  const look =
    view.phase === 'Choosing' ? view.playerLooks.get(view.turnPlayerId ?? '') : undefined;
  return look === undefined ? undefined : accentFor(look.color).tint;
}

/** The note at the top of a game screen: what is happening, with the mark saying it still is.
 * The countdown is drawn behind the sentence rather than under it, so a timed phase is one
 * block and a phase nobody waits out is the same block with no bar in it. */
export function PhaseInfoView({ view }: PhaseViewProps) {
  const { remainingMs, totalMs } = clockOf(view);
  usePhaseAlarm(view);
  const turnName =
    view.turnPlayerId === null ? '' : (view.playerNames.get(view.turnPlayerId) ?? '');
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  // The question sits on the screen in its own right, so the sentence stops naming a choice the
  // room has already made and says what it is doing instead.
  const sentence =
    choosing?.question !== undefined
      ? Strings.phase.readingQuestion
      : PhaseSentences[view.phase]({ turnName, hasSubmitted: view.hasSubmitted });
  // Connecting is not a game phase, so the table has no row for it and nothing is timed.
  const timed = view.phase !== 'Connecting' && isTimedPhase(view.phase);
  const secondsLeft = Math.ceil(remainingMs / 1000);
  // A step up per closing second, so the phase is heard running out in the beat already playing.
  const urgentSeconds = Math.ceil(GameConfig.timing.countdownUrgentMs / 1000);
  const beatSemitones =
    Math.max(0, urgentSeconds - secondsLeft) * GameConfig.timing.countdownPitchStepSemitones;
  const tint = tintOf(view, choosing?.question !== undefined);

  return (
    <Stack align="Center" gap="Sm">
      {timed ? (
        <Timer
          remainingMs={remainingMs}
          totalMs={totalMs}
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

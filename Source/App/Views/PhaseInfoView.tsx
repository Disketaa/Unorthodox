import { useEffect } from 'preact/hooks';
import { Character, Timer } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import {
  GameConfig,
  isPhaseName,
  isTimedPhase,
  questionRevealMs,
  type PublicChoosingState,
} from '@/Game';
import { accentFor } from '@/Core';
import { useCountdown } from '../Hooks/UseCountdown';
import { usePhaseAlarm } from '../Hooks/UsePhaseAlarm';
import type { SessionPhaseName } from '../Hooks/UseSessionPhase';
import type { GameSessionView } from '../Hooks/UseGameSession';
import { gameOverOf, winnerLookOf, winningClockOf } from './GameOver';
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
  Leaderboard: () => Strings.phase.leaderboard,
  Winning: () => Strings.phase.winning,
};

/** The clock the block at the top is counting, and how long it runs. The question is its own
 * clock rather than the bank's, which stopped when the theme was answered. */
function clockOf(view: GameSessionView): {
  remainingMs: number;
  totalMs: number;
  deadline: number;
  ringing: boolean;
} {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const question = choosing?.question;
  const totalMs = question === undefined ? view.durationMs : questionRevealMs(question);
  const startedAt = question === undefined ? view.phaseStartedAt : (choosing?.questionAt ?? 0);
  const answeredAt = question === undefined ? view.answeredAt : undefined;
  const endsAt = answeredAt ?? startedAt + view.clockOffsetMs + totalMs;
  return {
    totalMs,
    deadline: endsAt,
    ringing: answeredAt === undefined && isPhaseName(view.phase) && isTimedPhase(view.phase),
    remainingMs: useCountdown(
      totalMs,
      startedAt,
      view.clockOffsetMs,
      true,
      answeredAt,
      view.paused,
      view.pausedAt
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

/** The sentence the note carries: what the room is doing, in this browser's own voice. */
function sentenceFor(
  view: GameSessionView,
  choosing: PublicChoosingState | undefined,
  turnName: string
): string {
  // The question is what the room reads once the bank is answered, whether or not it has arrived
  // on screen yet, so the sentence stops naming a choice the room has already made.
  if (choosing?.theme !== undefined) return Strings.phase.readingQuestion;
  return PhaseSentences[view.phase]({ turnName, hasSubmitted: view.hasSubmitted });
}

/** The page behind a room that ends without a winner: washed in the same pink a seat the round
 * gave nothing to wears, written onto the page the way a chosen theme's wash is, and taken away
 * on the way out so the next screen starts on its own paper. */
function useNoWinnerWash(noWinner: boolean): void {
  useEffect(() => {
    if (!noWinner) return;
    document.body.style.setProperty('--Color-Page-Fill', 'var(--Color-Feedback-Muted-Wash)');
    return () => document.body.style.removeProperty('--Color-Page-Fill');
  }, [noWinner]);
}

/** The note at the top of a game screen: what is happening, with the mark saying it still is.
 * The countdown is drawn behind the sentence rather than under it, so a timed phase is one
 * block and a phase nobody waits out is the same block with no bar in it. */
/** Computed values for the phase note, kept out of the component so it stays short. */
function phaseInfo(
  view: GameSessionView,
  clock: { remainingMs: number; totalMs: number; deadline: number; ringing: boolean }
) {
  const turnName =
    view.turnPlayerId === null ? '' : (view.playerNames.get(view.turnPlayerId) ?? '');
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const over = gameOverOf(view);
  const endgame = over && (view.phase === 'Winning' || view.phase === 'Leaderboard');
  const winning = winningClockOf(view);
  const winningRemaining = winning?.remainingMs ?? 0;
  const revealed =
    endgame &&
    (view.phase === 'Leaderboard' || (winning !== undefined && winningRemaining <= 0));
  const winnerLook = revealed ? winnerLookOf(view) : undefined;
  const noWinner = revealed && winnerLook === undefined;
  const winnerName = winnerLook === undefined ? undefined : view.playerNames.get(winnerLook.id);
  const sentence =
    revealed && winnerName === undefined
      ? Strings.phase.noWinner
      : winnerName === undefined
        ? sentenceFor(view, choosing, turnName)
        : Strings.phase.winner(winnerName);
  const counting = winning !== undefined && winningRemaining > 0;
  const timerRemainingMs = counting
    ? winningRemaining
    : endgame
      ? clock.totalMs
      : clock.remainingMs;
  const timerTotalMs = counting ? (winning?.totalMs ?? clock.totalMs) : clock.totalMs;
  const secondsLeft = Math.ceil(timerRemainingMs / 1000);
  const urgentSeconds = Math.ceil(GameConfig.timing.countdownUrgentMs / 1000);
  const beatSemitones = endgame
    ? 0
    : Math.max(0, urgentSeconds - secondsLeft) * GameConfig.timing.countdownPitchStepSemitones;
  const tint = revealed
    ? winnerLook === undefined
      ? 'var(--Color-Feedback-Error)'
      : accentFor(winnerLook.look.color).tint
    : tintOf(view, choosing?.question !== undefined);
  return {
    turnName,
    choosing,
    over,
    endgame,
    winning,
    winningRemaining,
    revealed,
    winnerLook,
    noWinner,
    winnerName,
    sentence,
    counting,
    timerRemainingMs,
    timerTotalMs,
    secondsLeft,
    urgentSeconds,
    beatSemitones,
    tint,
  };
}

export function PhaseInfoView({ view }: PhaseViewProps) {
  const clock = clockOf(view);
  const { deadline, ringing } = clock;
  usePhaseAlarm({ deadline, ringing, paused: view.paused });
  const info = phaseInfo(view, clock);
  useNoWinnerWash(info.noWinner);
  return (
    <Stack align="Center" gap="Sm">
      <Timer
        remainingMs={info.timerRemainingMs}
        totalMs={info.timerTotalMs}
        seconds={
          info.endgame && !info.counting ? '' : Strings.common.secondsLeft(info.secondsLeft)
        }
        badge={
          info.revealed && info.winnerLook !== undefined ? (
            <Character
              character={info.winnerLook.look.character}
              color={info.winnerLook.look.color}
              size="Medium"
            />
          ) : undefined
        }
        urgent={
          info.endgame ? false : info.timerRemainingMs <= GameConfig.timing.countdownUrgentMs
        }
        beatSemitones={info.beatSemitones}
        tint={info.tint}
      >
        {info.sentence}
      </Timer>
    </Stack>
  );
}

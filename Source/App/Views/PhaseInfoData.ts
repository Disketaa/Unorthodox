import { useEffect } from 'preact/hooks';
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
import { gameOverOf, winnerLookOf, winningClockOf } from './GameOver';
import type { GameSessionView } from '../Hooks/UseGameSession';

export function clockOf(view: GameSessionView) {
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

export function tintOf(view: GameSessionView, reading: boolean): string | undefined {
  if (reading) return accentFor('Sky').tint;
  const look =
    view.phase === 'Choosing' ? view.playerLooks.get(view.turnPlayerId ?? '') : undefined;
  return look === undefined ? undefined : accentFor(look.color).tint;
}

function sentenceFor(
  view: GameSessionView,
  choosing: PublicChoosingState | undefined,
  turnName: string
): string {
  if (choosing?.theme !== undefined) return Strings.phase.readingQuestion;
  const PhaseSentences = {
    Connecting: () => Strings.phase.connecting,
    Lobby: () => Strings.lobby.waitingForHost,
    Choosing: (story: { turnName: string; hasSubmitted: boolean }) =>
      Strings.phase.choosingTheme(story.turnName),
    Writing: (story: { turnName: string; hasSubmitted: boolean }) =>
      story.hasSubmitted ? Strings.writing.waitForOthers : Strings.phase.writing,
    Reviewing: () => Strings.phase.reviewing,
    Scores: () => Strings.phase.scores,
    Leaderboard: () => Strings.phase.leaderboard,
    Winning: () => Strings.phase.winning,
  };
  return PhaseSentences[view.phase]({ turnName, hasSubmitted: view.hasSubmitted });
}

export function useNoWinnerWash(noWinner: boolean): void {
  useEffect(() => {
    if (!noWinner) return;
    document.body.style.setProperty('--Color-Page-Fill', 'var(--Color-Feedback-Muted-Wash)');
    return () => document.body.style.removeProperty('--Color-Page-Fill');
  }, [noWinner]);
}

function endgameInfo(view: GameSessionView) {
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
  return {
    over,
    endgame,
    winning,
    winningRemaining,
    revealed,
    winnerLook,
    noWinner,
    winnerName,
  };
}

function timerInfo(
  clock: { remainingMs: number; totalMs: number; deadline: number; ringing: boolean },
  info: ReturnType<typeof endgameInfo>,
  view: GameSessionView
) {
  const { endgame, winning, winningRemaining, revealed, winnerLook } = info;
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
    : tintOf(
        view,
        view.publicState?.phase === 'Choosing' && view.publicState?.question !== undefined
      );
  return {
    counting,
    timerRemainingMs,
    timerTotalMs,
    secondsLeft,
    urgentSeconds,
    beatSemitones,
    tint,
  };
}

export function phaseInfo(
  view: GameSessionView,
  clock: { remainingMs: number; totalMs: number; deadline: number; ringing: boolean }
) {
  const turnName =
    view.turnPlayerId === null ? '' : (view.playerNames.get(view.turnPlayerId) ?? '');
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  const endInfo = endgameInfo(view);
  const timer = timerInfo(clock, endInfo, view);
  const sentence =
    endInfo.revealed && endInfo.winnerName === undefined
      ? Strings.phase.noWinner
      : endInfo.winnerName === undefined
        ? sentenceFor(view, choosing, turnName)
        : Strings.phase.winner(endInfo.winnerName);
  return {
    turnName,
    choosing,
    ...endInfo,
    sentence,
    ...timer,
  };
}

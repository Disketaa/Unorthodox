/** The host's own moves between phases, bound to a session. Held apart from the session so that
 * the file which owns the roster and the room holds a list of forwards rather than a list of
 * phase changes: a new phase is one line here and one line in `HostFlow`, not two in a class. */
import type { PlayerId, ThemeId } from '@/Core';
import {
  startGameFrom,
  startWritingFrom,
  revealQuestionFrom,
  startRandomPickFrom,
  resolveRandomPickFrom,
  chooseThemeFrom,
  setPausedFrom,
  endReviewingFrom,
  nextRoundFrom,
  nextPhaseFrom,
  type FlowHost,
} from './HostFlow';

/** What the bound methods need from the session they are bound to. */
export interface HostFlowMoves {
  startGame(): void;
  startWriting(topic: string): void;
  revealQuestion(question: string): void;
  chooseTheme(theme: ThemeId): void;
  startRandomPick(): void;
  resolveRandomPick(): void;
  setPaused(paused: boolean): void;
  endReviewing(durationMs: number): void;
  nextRound(): void;
  nextPhase(topic: string): void;
}

export function hostFlowMoves(
  flow: () => FlowHost,
  roomCode: () => string,
  playerId: PlayerId
): HostFlowMoves {
  return {
    startGame: () => startGameFrom(flow()),
    startWriting: (topic) => startWritingFrom(flow(), roomCode(), topic),
    revealQuestion: (question) => revealQuestionFrom(flow(), question),
    chooseTheme: (theme) => chooseThemeFrom(flow(), roomCode(), theme, playerId),
    startRandomPick: () => startRandomPickFrom(flow(), roomCode()),
    resolveRandomPick: () => resolveRandomPickFrom(flow(), roomCode()),
    setPaused: (paused) => setPausedFrom(flow(), paused),
    endReviewing: (durationMs) => endReviewingFrom(flow(), durationMs),
    nextRound: () => nextRoundFrom(flow()),
    nextPhase: (topic) => nextPhaseFrom(flow(), topic),
  };
}

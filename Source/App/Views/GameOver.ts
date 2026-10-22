import { bankSize, roomIsOver, roomThemes, winningRevealAtMs } from '@/Game';
import type { PlayerLook } from '@/Core';
import type { GameSessionView } from '../Hooks/UseGameSession';

/** A player the room scored, with the id the screens find them by. */
export interface RoomWinner {
  id: string;
  score: number;
}

/** The room's winner: the highest total, and the first of them where two are level, so every
 * screen names the same player. A room that scored nothing has no winner at all rather than the
 * first name on the roster, which is what a bare `>` over a list of zeroes would hand back. */
export function winnerOf(scores: readonly RoomWinner[]): RoomWinner | undefined {
  let best: RoomWinner | undefined;
  for (const entry of scores) {
    if (best === undefined || entry.score > best.score) best = entry;
  }
  return best !== undefined && best.score > 0 ? best : undefined;
}

/** The winner's look, taken off the room's roster so every screen names the same player. */
export function winnerLookOf(
  view: GameSessionView
): { id: string; look: PlayerLook } | undefined {
  const publicState = view.publicState;
  if (publicState === undefined || !('scores' in publicState)) return undefined;
  const best = winnerOf(publicState.scores);
  if (best === undefined) return undefined;
  const look = view.playerLooks.get(best.id);
  return look === undefined ? undefined : { id: best.id, look };
}

/** The winning show's own clock: the lead-in, every card leaving, and the beat before the winner
 * stands. Frozen on a held room, and absent outside the show. */
export function winningClockOf(
  view: GameSessionView
): { totalMs: number; remainingMs: number } | undefined {
  if (view.phase !== 'Winning') return undefined;
  const state = view.publicState?.phase === 'Winning' ? view.publicState : undefined;
  const cards = bankSize({
    themeMode: state?.themeMode ?? 'Random',
    themes: state?.themes ?? [],
    customThemes: state?.customThemes ?? [],
  });
  const totalMs = winningRevealAtMs(cards);
  const moment = view.paused && view.pausedAt !== undefined ? view.pausedAt : Date.now();
  return { totalMs, remainingMs: Math.max(0, totalMs - (moment - view.phaseStartedAt)) };
}

/** Whether the game is over: every theme in the bank has been played for every round it can be.
 * Read off the public state the same way the host reads its own, so a client cannot disagree
 * with the host about whether the game has nothing left to play. */
export function gameOverOf(view: GameSessionView): boolean {
  const publicState = view.publicState;
  if (publicState === undefined) return false;
  const played = new Map(
    (publicState.spent ?? []).map((entry) => [entry.theme, entry.rounds])
  );
  const themes = roomThemes({
    roomCode: view.roomCode,
    pace: publicState.pace,
    themeMode: publicState.themeMode,
    themes: publicState.themes,
    customThemes: publicState.customThemes,
  });
  return roomIsOver(played, themes);
}

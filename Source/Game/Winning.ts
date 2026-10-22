import {
  themePool,
  themeQuestions,
  themesForRoom,
  type CustomTheme,
  type ThemeId,
  type ThemeMode,
} from '@/Core';
import { GameConfig } from './GameConfig';
import { gameIsOver } from './ThemeRounds';

/** A theme the room has, and how many questions it has to answer with. */
export interface RoomTheme {
  id: ThemeId;
  questions: number;
}

/** Whether the room has anything left to play: every round the game is played, or every theme
 * the room has is out of questions. A room with a small bank of custom themes runs out of
 * questions long before it runs out of rounds, and it is the questions that stop it. */
export function roomIsOver(
  played: ReadonlyMap<ThemeId, number>,
  themes: readonly RoomTheme[]
): boolean {
  let rounds = 0;
  for (const count of played.values()) rounds += count;
  if (gameIsOver(rounds)) return true;
  if (themes.length === 0) return false;
  return themes.every((theme) => (played.get(theme.id) ?? 0) >= theme.questions);
}

/** The themes the room may be dealt, and how many rounds each of them can still be played for.
 * The pool rather than the bank it was dealt out of, since the pool is what the host and every
 * client can both work out without knowing how the room's own roll came out. */
export function roomThemes(state: {
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  customThemes: readonly CustomTheme[];
}): RoomTheme[] {
  const { roundsPerTheme } = GameConfig.themes;
  const custom = new Map(state.customThemes.map((theme) => [theme.name, theme]));
  const pool = themePool(state.themeMode, state.themes, state.customThemes);
  return pool.map((id) => {
    const own = custom.get(id);
    const asked = own?.questions.length ?? themeQuestions(id)?.length ?? roundsPerTheme;
    return { id, questions: Math.min(roundsPerTheme, asked) };
  });
}

/** The bank this room is playing, rolled the same way on every screen: the room's own code, the
 * pool it has left switched on, and the number of cards the game deals. */
export function bankThemes(
  roomCode: string,
  themeMode: ThemeMode,
  enabledThemes: readonly ThemeId[],
  customThemes: readonly CustomTheme[]
): ThemeId[] {
  const pool = themePool(themeMode, enabledThemes, customThemes);
  return themesForRoom(roomCode, GameConfig.themes.cardsPerLobby, pool);
}

/** How many cards the room's bank holds, which is how long the show that takes it away runs for.
 * The same bank every screen draws, so the count is worked out the same way in both places: the
 * host off the room's own themes, the client off the ones the room was sent. */
export function bankSize(state: {
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  customThemes: readonly CustomTheme[];
}): number {
  const pool = themePool(state.themeMode, state.themes, state.customThemes);
  return Math.min(GameConfig.themes.cardsPerLobby, pool.length);
}

/** How long the winning show runs for a bank of this many cards: each card taken away in turn,
 * and then the beat the winner stands in before the room is shown where everybody ended up. */
export function winningDurationMs(cards: number): number {
  return Math.max(0, cards) * GameConfig.timing.winningCardMs + GameConfig.timing.winningHoldMs;
}

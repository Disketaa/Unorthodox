import {
  themePool,
  themeQuestions,
  themesForRoom,
  type CustomTheme,
  type ThemeId,
  type ThemeMode,
} from '@/Core';
import { GameConfig, type Pace } from './GameConfig';

/** A theme in the room's bank, and how many rounds the game can play it for. */
export interface RoomTheme {
  id: ThemeId;
  questions: number;
}

/** Whether the room has anything left to play: every theme in its bank has been played for every
 * round the game gives it. A theme gets its own question count up to the pace's ceiling, so a
 * one-question theme is one round and an eight-question theme is four or eight. */
export function roomIsOver(
  played: ReadonlyMap<ThemeId, number>,
  themes: readonly RoomTheme[]
): boolean {
  if (themes.length === 0) return false;
  return themes.every((theme) => (played.get(theme.id) ?? 0) >= theme.questions);
}

/** The themes the room's bank actually holds, and how many rounds each can be played for: its
 * own question count, capped by the pace. The dealt bank rather than the pool: a theme that was
 * not dealt cannot be played, so it must not keep the room open. */
export function roomThemes(state: {
  roomCode: string;
  pace: Pace;
  themeMode: ThemeMode;
  themes: readonly ThemeId[];
  customThemes: readonly CustomTheme[];
}): RoomTheme[] {
  const ceiling = GameConfig.themes.roundsPerPace[state.pace];
  const custom = new Map(state.customThemes.map((theme) => [theme.name, theme]));
  const bank = bankThemes(state.roomCode, state.themeMode, state.themes, state.customThemes);
  return bank.map((id) => {
    const own = custom.get(id);
    const asked = own?.questions.length ?? themeQuestions(id)?.length ?? ceiling;
    return { id, questions: Math.min(ceiling, asked) };
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

/** How long into the winning show the winner is named: the bank held, every card taken away, and
 * the empty stage's beat. The timer holds its sentence until then, so it cannot name the winner
 * before the screen does. */
export function winningRevealAtMs(cards: number): number {
  const timing = GameConfig.timing;
  return (
    timing.winningLeadInMs + Math.max(0, cards) * timing.winningCardMs + timing.winningRevealMs
  );
}

/** How long the winning show runs for a bank of this many cards: the reveal, and then the beat
 * the winner stands in before the room is shown where everybody ended up. */
export function winningDurationMs(cards: number): number {
  return winningRevealAtMs(cards) + GameConfig.timing.winningHoldMs;
}

/** The themes one room may be dealt from, and the one its own roll lands on. Its own file rather
 * than a helper in `HostPhases`, which is about moves between phases: dealing a bank is not a
 * phase change, and the roll belongs beside the pool it is rolled out of. */
import { themePool, themesForRoom, type Random, type ThemeRef } from '@/Core';
import * as Game from '@/Game';

/** The themes one room is offered: rolled from its code and dealt out of the pool the host has
 * left switched on, which is the same pool every client screen drew from вЂ” a roll out of the
 * whole set would land on a card nobody in the room is holding. */
export function offeredThemes(state: Game.HostState, roomCode: string): ThemeRef[] {
  const { cardsPerLobby } = Game.GameConfig.themes;
  const custom = [...(state.customThemes?.values() ?? [])];
  return themesForRoom(roomCode, cardsPerLobby, themePool(state.themeMode, state.themes, custom));
}

/** The bank nobody answered. The room's own roll, out of the themes still in play in it вЂ” an
 * exhausted bank is still a bank to be answered вЂ” and out of the pool the host left switched
 * on, since a roll out of the whole set lands on a card nobody in the room is holding. */
export function drawableTheme(
  state: Game.HostState,
  roomCode: string,
  random: Random
): ThemeRef {
  const { roundsPerTheme } = Game.GameConfig.themes;
  const themes = offeredThemes(state, roomCode);
  const inPlay = themes.filter((theme) => (state.themeRounds.get(theme) ?? 0) < roundsPerTheme);
  const pool = inPlay.length > 0 ? inPlay : themes;
  return pool[Math.floor(random() * pool.length)] ?? themes[0] ?? 'Random';
}

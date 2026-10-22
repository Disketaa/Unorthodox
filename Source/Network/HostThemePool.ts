/** The themes one room may be dealt from, and the one its own roll lands on. Its own file rather
 * than a helper in `HostPhases`, which is about moves between phases: dealing a bank is not a
 * phase change, and the roll belongs beside the pool it is rolled out of. */
import { themePool, themeQuestions, themesForRoom, type Random, type ThemeId } from '@/Core';
import * as Game from '@/Game';

/** The themes one room is offered: rolled from its code and dealt out of the pool the host has
 * left switched on, which is the same pool every client screen drew from — a roll out of the
 * whole set would land on a card nobody in the room is holding. */
export function offeredThemes(state: Game.HostState, roomCode: string): ThemeId[] {
  const { cardsPerLobby } = Game.GameConfig.themes;
  const custom = [...(state.customThemes?.values() ?? [])];
  return themesForRoom(
    roomCode,
    cardsPerLobby,
    themePool(state.themeMode, state.themes, custom)
  );
}

/** Whether a theme still has a question left for the room to answer. A theme out of questions is
 * out of the room: the card on it is spent out, and a room handed a question it has already
 * answered is a round nobody can play. */
export function themeIsPlayable(state: Game.HostState, theme: ThemeId): boolean {
  const ceiling = Game.GameConfig.themes.roundsPerPace[state.pace];
  const played = state.themeRounds.get(theme) ?? 0;
  const asked =
    state.customThemes?.get(theme)?.questions.length ??
    themeQuestions(theme)?.length ??
    ceiling;
  return played < ceiling && played < asked;
}

/** A theme the room can still be asked about, chosen from its bank, or undefined where every
 * card is spent out and the game has nothing left to play. */
export function playableTheme(
  state: Game.HostState,
  roomCode: string,
  random: Random
): ThemeId | undefined {
  const ceiling = Game.GameConfig.themes.roundsPerPace[state.pace];
  const themes = offeredThemes(state, roomCode);
  // A theme whose questions are used up is not dealt again, whatever the room's own count says:
  // the card on it is spent out, and a room handed a question it has already answered is a round
  // nobody can play.
  const inPlay = themes.filter(
    (theme) => (state.themeRounds.get(theme) ?? 0) < ceiling && themeIsPlayable(state, theme)
  );
  return inPlay[Math.floor(random() * inPlay.length)];
}

/** The bank nobody answered: a roll out of the themes still in play in it, out of the pool the
 * host left switched on. Returns undefined when nothing in the bank can be played: the game has
 * nothing left to answer, so the caller ends the game instead of sweeping. */
export function drawableTheme(
  state: Game.HostState,
  roomCode: string,
  random: Random
): ThemeId | undefined {
  return playableTheme(state, roomCode, random);
}

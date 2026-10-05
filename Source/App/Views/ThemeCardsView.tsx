import { ThemeId, dealThemes, randomFor } from '@/Core';
import { ThemeCards } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface ThemeCardsViewProps {
  /** The room's code, which is what the deal is rolled from. */
  roomCode: string;
  /** How many of each theme's rounds have been played. Nothing counts rounds yet, so the bank is
   * drawn full. Passed in rather than read from a module that does not exist yet, so nothing on
   * the cards changes when the round arrives. */
  spent?: number;
}

/** The themes this lobby is playing, on the game screen. Rolled from the room code rather than
 * `Math.random`, which is the whole of "random per lobby": two players in one room derive the
 * same six from the same four letters. */
export function ThemeCardsView({ roomCode, spent }: ThemeCardsViewProps) {
  const themes: readonly ThemeId[] = dealThemes(
    randomFor(roomCode),
    GameConfig.themes.cardsPerLobby,
  );
  return (
    <ThemeCards
      themes={themes}
      names={Strings.themes.names}
      roundsPerTheme={GameConfig.themes.roundsPerTheme}
      spent={spent}
    />
  );
}

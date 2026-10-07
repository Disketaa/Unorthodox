import { ThemeId, dealThemes, randomFor } from '@/Core';
import { ThemeCards } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface ThemeCardsViewProps {
  /** The room's code, which is what the deal is rolled from. */
  roomCode: string;
  /** Whether it is this player's turn to pick. A client whose turn it is not sees the same six
   * cards held back rather than a different six, since the bank is the room's and not theirs. */
  isMyTurn: boolean;
  /** Whether the room is choosing a theme at all. False in every other phase, where the bank is
   * on screen as a backdrop and nothing about it is being asked. */
  choosing: boolean;
  /** Starting the round the chosen theme asks about. */
  onPickTheme: () => void;
  /** How many of each theme's rounds have been played. Nothing counts rounds yet, so the bank is
   * drawn full. Passed in rather than read from a module that does not exist yet, so nothing on
   * the cards changes when the round arrives. */
  spent?: number;
}

/** The themes this lobby is playing, on the game screen. Rolled from the room code rather than
 * `Math.random`, which is the whole of "random per lobby": two players in one room derive the
 * same six from the same four letters. */
export function ThemeCardsView({
  roomCode,
  isMyTurn,
  choosing,
  onPickTheme,
  spent,
}: ThemeCardsViewProps) {
  const themes: readonly ThemeId[] = dealThemes(
    randomFor(roomCode),
    GameConfig.themes.cardsPerLobby
  );
  return (
    <ThemeCards
      themes={themes}
      names={Strings.themes.names}
      roundsPerTheme={GameConfig.themes.roundsPerTheme}
      spent={spent}
      // Asked for only where it is the room's turn to answer. Absent anywhere else is what holds
      // the cards back: nothing to press, rather than a press that goes nowhere.
      onPick={choosing && isMyTurn ? onPickTheme : undefined}
    />
  );
}

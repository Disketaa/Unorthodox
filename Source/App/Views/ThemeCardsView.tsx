import { ThemeId, dealThemes, randomFor } from '@/Core';
import { ThemeCards } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface ThemeCardsViewProps {
  /** The room's code, which is what the deal is rolled from. */
  roomCode: string;
  /** Whether the room is choosing a theme at all. False in every other phase, where the bank is
   * on screen as a backdrop and nothing about it is being asked. */
  choosing: boolean;
  /** Whether the turn to pick a theme is this player's. False holds the bank back — muted and
   * unpressable, still under the pointer — rather than letting a press be sent and refused by
   * the host, which would look like a dead card rather than as somebody else's turn. */
  myTurn: boolean;
  /** The theme the room has settled on, or undefined while the bank is still being offered. The
   * room's answer rather than this player's, so every screen expands the same card at once. */
  theme: ThemeId | undefined;
  /** Answering the bank, from whichever player's turn it happens to be. */
  onPickTheme: (theme: ThemeId) => void;
  /** How many rounds have been played in each theme so far, keyed the same way as `theme`. */
  spent?: ReadonlyMap<ThemeId, number>;
}

/** The themes this lobby is playing, on the game screen. Rolled from the room code rather than
 * `Math.random`, which is the whole of "random per lobby": two players in one room derive the
 * same six from the same four letters. */
export function ThemeCardsView({
  roomCode,
  choosing,
  myTurn,
  theme,
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
      picked={theme}
      // Asked for only where it is this player's turn to answer. Absent anywhere else is what holds
      // the cards back: nothing to press, rather than a press the host refuses.
      onPick={choosing && myTurn ? onPickTheme : undefined}
    />
  );
}

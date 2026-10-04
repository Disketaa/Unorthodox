import { ThemeId, dealThemes, randomFor } from '@/Core';
import { ThemeCards } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface ThemeCardsViewProps {
  /** The room's code, which is what the deal is rolled from. */
  roomCode: string;
  /**
   * How many of each theme's rounds have been played.
   *
   * Nothing counts rounds yet — the phase screens are still unmounted and no
   * public state carries a round — so the bank is drawn full, which is what a
   * theme nobody has chosen yet looks like. It is passed in rather than read
   * from a module that does not exist yet, so when the round arrives it is one
   * value from the view and nothing on the cards changes.
   */
  spent?: number;
}

/**
 * The themes this lobby is playing, on the game screen.
 *
 * Rolled from the room code rather than from `Math.random`, which is the whole
 * of the "random per lobby" requirement: two players in one room derive the
 * same six themes from the same four letters, and two rooms almost never derive
 * the same six. Until the host owns this and sends it, a per-device roll would
 * give every player a different hand and there would be no hand at all.
 *
 * No state and no memo, because the deal is a pure function of the code and a
 * lobby does not change its code: recomputing it on a render is cheaper than
 * remembering it, and a remembered deal would be a second copy of the answer to
 * keep in step.
 */
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

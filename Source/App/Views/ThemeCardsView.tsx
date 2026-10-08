import { ThemeId, themesForRoom } from '@/Core';
import { useMemo } from 'preact/hooks';
import { useThemeSweep } from '../Hooks/UseThemeSweep';
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
  /** The room answering its own bank, and when it started. Absent unless the bank closed with
   * nothing pressed on it, which is what the sweep is drawn from. */
  picking: { theme: ThemeId; startedAt: number } | undefined;
  /** Skew between the host's clock and this device's, so the sweep runs the room's length. */
  clockOffsetMs: number;
  /** Whether the host is holding the room, which stops a card being pressed. */
  paused?: boolean;
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
  picking,
  clockOffsetMs,
  paused = false,
  onPickTheme,
  spent,
}: ThemeCardsViewProps) {
  // Held across renders, because a fresh array every render is a fresh dependency: the sweep
  // walks off one, and a walk that restarts after every hop is a hop somewhere random every hop.
  const themes = useMemo(
    () => themesForRoom(roomCode, GameConfig.themes.cardsPerLobby),
    [roomCode]
  );
  const { looking } = useThemeSweep(picking, themes, clockOffsetMs);
  return (
    <ThemeCards
      themes={themes}
      names={Strings.themes.names}
      roundsPerTheme={GameConfig.themes.roundsPerTheme}
      spent={spent}
      picked={theme}
      picking={picking !== undefined}
      swept={looking}
      // Asked for only where it is this player's turn, and never while the room is answering
      // itself: the room's roll wins, because the room acts for everybody. Absent anywhere
      // else is what holds the cards back.
      onPick={choosing && myTurn && picking === undefined && !paused ? onPickTheme : undefined}
    />
  );
}

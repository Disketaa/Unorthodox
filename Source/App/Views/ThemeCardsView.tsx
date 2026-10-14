import { ThemeId, themesForRoom } from '@/Core';
import { useMemo } from 'preact/hooks';
import { useThemeSweep } from '../Hooks/UseThemeSweep';
import { ThemeCards } from '@/Design/Components';
import { GameConfig, multForTheme, modifiersForRound } from '@/Game';

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
function computeMults(
  roomCode: string,
  themes: readonly ThemeId[],
  round: number,
  modifiers: ReadonlyMap<ThemeId, readonly ThemeModifierId[]>
): ReadonlyMap<ThemeId, number> {
  const map = new Map<ThemeId, number>();
  for (const theme of themes) {
    const mods = modifiers.get(theme);
    if (mods?.includes('Enchanted')) {
      map.set(theme, multForTheme(roomCode, theme, round));
    }
  }
  return map;
}

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
  // What this round has put on the bank, rolled from the room code and the round rather than
  // sent, so a client cannot deal a different set of enchanted cards from the host. Held across
  // renders for the same reason the deal is: a fresh map every render is a fresh roll.
  const round = spentRounds(spent);
  const modifiers = useMemo(
    () => modifiersForRound(roomCode, themes, round),
    [roomCode, themes, round]
  );
  // Multiplier rolled per theme from room/round seed; only enchanted cards get >1.
  const mults = useMemo(
    () => computeMults(roomCode, themes, round, modifiers),
    [roomCode, themes, round, modifiers]
  );
  return (
    <ThemeCards
      themes={themes}
      roundsPerTheme={GameConfig.themes.roundsPerTheme}
      spent={spent}
      modifiers={modifiers}
      mults={mults}
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

/** How many rounds the room has played, which is the number the next round is rolled against.
 * Counted off the per-theme counts rather than carried as a counter of its own, since those are
 * what the state holds and a second number in it could drift away from them. */
function spentRounds(spent: ReadonlyMap<ThemeId, number> | undefined): number {
  if (spent === undefined) {
    return 0;
  }
  let total = 0;
  for (const rounds of spent.values()) {
    total += rounds;
  }
  return total;
}

import {
  ThemeId,
  ThemeMode,
  ThemeModifierId,
  effectOf,
  themePool,
  themesForRoom,
  type CustomTheme,
} from '@/Core';
import { useMemo } from 'preact/hooks';
import { useThemeSweep } from '../Hooks/UseThemeSweep';
import { ThemeCards } from '@/Design/Components';
import { GameConfig, Pace, multForTheme, modifiersForRound } from '@/Game';
import { effectLabelOf } from './EffectLabels';

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
  /** Which way the room is given its themes, and the ones it has named: the pool the deal is
   * rolled from. The room's own rather than this screen's, since a client that dealt out of the
   * whole set would hold cards the host's roll can never land on. */
  themeMode: ThemeMode;
  enabledThemes: readonly ThemeId[];
  /** The custom themes this room knows, so a theme the host pasted can be dealt into the bank on
   * every screen and not only on the host's. */
  customThemes?: readonly CustomTheme[];
  /** The pace the room plays at, which decides how many rounds each theme gets. */
  pace: Pace;
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

/** What each card's effect is called, in the player's language. */
function labelsFor(
  themes: readonly ThemeId[],
  modifiers: ReadonlyMap<ThemeId, readonly ThemeModifierId[]>
): ReadonlyMap<ThemeId, string> {
  const labels = new Map<ThemeId, string>();
  for (const theme of themes) {
    const label = effectLabelOf(effectOf(modifiers.get(theme)));
    if (label !== undefined) labels.set(theme, label);
  }
  return labels;
}

/** Everything the round has put on the bank: the modifiers, the multipliers and what each effect
 * is called. One roll of the modifiers feeding the other two, so a card's mult and its label
 * are always about the same enchantment. */
function bankFor(
  roomCode: string,
  themes: readonly ThemeId[],
  bankRound: number
): {
  modifiers: ReadonlyMap<ThemeId, readonly ThemeModifierId[]>;
  mults: ReadonlyMap<ThemeId, number>;
  effectLabels: ReadonlyMap<ThemeId, string>;
} {
  const modifiers = modifiersForRound(roomCode, themes, bankRound);
  return {
    modifiers,
    mults: computeMults(roomCode, themes, bankRound, modifiers),
    effectLabels: labelsFor(themes, modifiers),
  };
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
  themeMode,
  enabledThemes,
  customThemes,
  pace,
}: ThemeCardsViewProps) {
  const pool = useMemo(
    () => themePool(themeMode, enabledThemes, customThemes ?? []),
    [themeMode, enabledThemes, customThemes]
  );
  const themes = useMemo(
    () => themesForRoom(roomCode, GameConfig.themes.cardsPerLobby, pool),
    [roomCode, pool]
  );
  const { looking } = useThemeSweep(picking, themes, clockOffsetMs);
  const round = spentRounds(spent),
    bankRound = theme !== undefined ? Math.max(0, round - 1) : round;
  const { modifiers, mults, effectLabels } = useMemo(
    () => bankFor(roomCode, themes, bankRound),
    [roomCode, themes, bankRound]
  );
  const roundsPerTheme = pace === 'Fast' ? 5 : 10;
  return (
    <ThemeCards
      themes={themes}
      roundsPerTheme={roundsPerTheme}
      spent={spent}
      modifiers={modifiers}
      mults={mults}
      effectLabels={effectLabels}
      picked={theme}
      picking={picking !== undefined}
      swept={looking}
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

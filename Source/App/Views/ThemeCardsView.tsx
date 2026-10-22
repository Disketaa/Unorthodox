import { ThemeId, ThemeMode, ThemeModifierId, effectOf, type CustomTheme } from '@/Core';
import { useMemo } from 'preact/hooks';
import { useThemeSweep } from '../Hooks/UseThemeSweep';
import { ThemeCards } from '@/Design/Components';
import { GameConfig, Pace, bankThemes, multForTheme, modifiersForRound } from '@/Game';
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
  /** The cards the winning show has already taken away, which keep their cells. */
  gone?: ReadonlySet<ThemeId>;
  /** The card the winning show is taking away at this moment. */
  leaving?: ThemeId;
  /** Whether the round's enchantment is drawn on the bank. Off while the winning show takes the
   * cards away: the round it belonged to is over, and its multiplier is no longer in play. */
  enchant?: boolean;
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
  bankRound: number,
  enchant: boolean
): {
  modifiers: ReadonlyMap<ThemeId, readonly ThemeModifierId[]>;
  mults: ReadonlyMap<ThemeId, number>;
  effectLabels: ReadonlyMap<ThemeId, string>;
} {
  if (!enchant) {
    return { modifiers: new Map(), mults: new Map(), effectLabels: new Map() };
  }
  const modifiers = modifiersForRound(roomCode, themes, bankRound);
  return {
    modifiers,
    mults: computeMults(roomCode, themes, bankRound, modifiers),
    effectLabels: labelsFor(themes, modifiers),
  };
}

/** The bank this room is playing, and what the room has done to it: the themes offered, the
 * round each modifier counts for, and the theme the sweep is looking at. Worked out here so the
 * view below is only about handing the bank its props. */
function useBank(
  roomCode: string,
  themeMode: ThemeMode,
  enabledThemes: readonly ThemeId[],
  customThemes: readonly CustomTheme[] | undefined,
  spent: ReadonlyMap<ThemeId, number> | undefined,
  theme: ThemeId | undefined,
  picking: { theme: ThemeId; startedAt: number } | undefined,
  clockOffsetMs: number,
  enchant: boolean
) {
  const themes = useMemo(
    () => bankThemes(roomCode, themeMode, enabledThemes, customThemes ?? []),
    [roomCode, themeMode, enabledThemes, customThemes]
  );
  const { looking } = useThemeSweep(picking, themes, clockOffsetMs);
  const round = spentRounds(spent);
  const bankRound = theme !== undefined ? Math.max(0, round - 1) : round;
  const bank = useMemo(
    () => bankFor(roomCode, themes, bankRound, enchant),
    [roomCode, themes, bankRound, enchant]
  );
  return { themes, looking, ...bank };
}

export function ThemeCardsView(props: ThemeCardsViewProps) {
  const bank = useBank(
    props.roomCode,
    props.themeMode,
    props.enabledThemes,
    props.customThemes,
    props.spent,
    props.theme,
    props.picking,
    props.clockOffsetMs,
    props.enchant !== false
  );
  const pressable =
    props.choosing && props.myTurn && props.picking === undefined && props.paused !== true;
  return (
    <ThemeCards
      themes={bank.themes}
      roundsPerTheme={GameConfig.themes.roundsPerPace[props.pace]}
      spent={props.spent}
      modifiers={bank.modifiers}
      mults={bank.mults}
      effectLabels={bank.effectLabels}
      picked={props.theme}
      picking={props.picking !== undefined}
      swept={bank.looking}
      gone={props.gone}
      leaving={props.leaving}
      onPick={pressable ? props.onPickTheme : undefined}
    />
  );
}

/** The room's per-theme round counts as the map the cards read, built here because the state
 * arrives as the pairs it went out as. Nothing counted is empty, which draws full bars. */
export function spentByTheme(
  state: { spent: readonly { theme: ThemeId; rounds: number }[] } | undefined
): Map<ThemeId, number> | undefined {
  if (state === undefined) return undefined;
  return new Map(state.spent.map(({ theme, rounds }) => [theme, rounds]));
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

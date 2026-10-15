import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import styles from './Keyboard.module.css';
import { useHardwareTyping } from './HardwareKeys';
import { detectLayout, knownLayout } from './KeyboardSchema';
import {
  columnsOf,
  Layouts,
  otherLang,
  slotOf,
  Slots,
  type KeyboardLang,
} from './KeyboardLayouts';
import { keyNamer } from './KeyNamer';
import { chosenLayout, saveChosenLayout } from './KeyboardChoice';
import { RowKeys } from './KeyboardRow';
import { playSound } from '@/Design';

export type KeyboardKey = string | 'Backspace' | 'Space' | 'Enter' | 'Lang';

/** The keys that are not letters. Each carries only its own name, since a screen reader reads
 * the label beside it and a character on the key would say the same thing twice. */
export const Backspace = { key: 'Backspace' } as const;
export const Space = { key: 'Space' } as const;
export const Enter = { key: 'Enter' } as const;
export const Lang = { key: 'Lang' } as const;

/** The letters the keys come up on before anything is known: the game's own language. */
const DefaultLang: KeyboardLang = 'ru';

export interface KeyboardProps {
  disabled?: boolean;
  /** Whether enter can send what is typed. Drives the one key that sends rather than types,
   * which is drawn and animated only while it can: a send key that breathes on an empty draft
   * promises something it cannot do. */
  canSubmit?: boolean;
  /** The letters the round's enchanted card has banned, struck through on the keys and taking no
   * press. Both layouts are in the set, so a key asks one question whichever set is up. */
  banned?: ReadonlySet<string>;
  /** Letter or one of the named keys pressed, from a tap on the keys or from the hardware
   * keyboard behind them. The layout itself holds no text, so the field being typed into stays
   * the single place a draft exists. */
  onKeyPress?: (key: KeyboardKey) => void;
  /** Read out by a screen reader on the keys that carry a glyph rather than a letter. */
  backspaceLabel: string;
  spaceLabel: string;
  enterLabel: string;
  langLabel: string;
}

/** The four names a screen has to hand over, gathered once so the row and the keys that need
 * them are not handed the same five props separately. */
function useLabels(
  backspaceLabel: string,
  spaceLabel: string,
  enterLabel: string,
  langLabel: string
): Record<'Backspace' | 'Space' | 'Enter' | 'Lang', string> {
  return useMemo(
    () => ({
      Backspace: backspaceLabel,
      Space: spaceLabel,
      Enter: enterLabel,
      Lang: langLabel,
    }),
    [backspaceLabel, spaceLabel, enterLabel, langLabel]
  );
}

type Presses = Readonly<Record<string, number>>;

/** Open on the letters the player's keyboard is set to, where the browser will say. Settles on
 * it without moving the language key: the game noticing a board is not the player switching. A
 * layout the player chose by hand outranks what the browser reports. */
function useDetectedLayout(setLang: (lang: KeyboardLang) => void): void {
  useEffect(() => {
    if (chosenLayout() !== undefined) return;
    let mounted = true;
    void detectLayout().then((found) => {
      if (mounted && found !== undefined) setLang(found);
    });
    return () => {
      mounted = false;
    };
  }, [setLang]);
}

/** What one press does: count it against the slot the key sits in, and hand it on. The count is
 * what plays the pop, so a tap and a held key move the key the same way and exactly once. */
function usePress(
  rows: readonly (readonly string[])[],
  lang: KeyboardLang,
  chooseLang: (lang: KeyboardLang) => void,
  setPresses: (next: (current: Presses) => Presses) => void,
  banned: ReadonlySet<string> | undefined,
  onKeyPress: ((key: KeyboardKey) => void) | undefined
): (key: KeyboardKey) => void {
  return useCallback(
    (key: KeyboardKey) => {
      // A banned letter is not a key: no pop and no letter. Checked here rather than on the
      // button, so the hardware keyboard is held to it as well.
      if (banned?.has(key) === true) return;
      // The pop is the press, not the letter: it answers a tap on the language key and one on a
      // backspace the same as it answers a letter, and it is pitched at random so a run of typing
      // is a run of notes rather than one note repeated.
      playSound('Pop');
      // Counted against the slot rather than the letter, so a count does not follow the letter
      // when the layout changes and replay every key's last pop on the way back to where it was.
      const slot =
        key === Backspace.key
          ? Slots.Backspace
          : key === Space.key
            ? Slots.Space
            : key === Enter.key
              ? Slots.Enter
              : key === Lang.key
                ? Slots.Lang
                : slotOf(rows, key);
      // The language key is counted even though the press only moves the letters, so it pops for
      // the change it just made rather than appearing already turned over.
      if (slot !== undefined) {
        setPresses((current) => ({ ...current, [slot]: (current[slot] ?? 0) + 1 }));
      }
      if (key === Lang.key) {
        chooseLang(otherLang(lang));
        return;
      }
      onKeyPress?.(key);
    },
    [rows, lang, chooseLang, banned, onKeyPress, setPresses]
  );
}

/** The letter set the keys are drawn in, and the one thing that turns them over. Opening on what
 * the player chose last time, then on what the browser says, then on the game's own language.
 * Kept rather than remembered: the keyboard is built again for every round. */
function useLayout(): [KeyboardLang, (lang: KeyboardLang) => void] {
  const [lang, setLang] = useState<KeyboardLang>(
    () => chosenLayout() ?? knownLayout() ?? DefaultLang
  );
  const choose = useCallback((next: KeyboardLang) => {
    saveChosenLayout(next);
    setLang(next);
  }, []);
  useDetectedLayout(setLang);
  return [lang, choose];
}

/** The on-screen letter keys of the writing phase, in Russian or English. The language is held
 * here rather than asked for, since it is a fact about the keys and nothing else in the game
 * reads it: the draft is a string and a letter is a letter whichever set it came from. */
export function Keyboard({
  disabled = false,
  canSubmit = false,
  banned,
  onKeyPress,
  backspaceLabel,
  spaceLabel,
  enterLabel,
  langLabel,
}: KeyboardProps) {
  const [lang, chooseLang] = useLayout();
  const [presses, setPresses] = useState<Readonly<Record<string, number>>>({});
  const rows = Layouts[lang];
  const columns = columnsOf(rows);
  const classes = [styles.Root, styles[`Columns${columns}`]].join(' ');
  const name = useMemo(() => keyNamer(rows), [lang]);
  const press = usePress(rows, lang, chooseLang, setPresses, banned, onKeyPress);
  const switchLang = useCallback(() => press(Lang.key), [press]);
  useHardwareTyping(!disabled, name, press, switchLang);
  const labels = useLabels(backspaceLabel, spaceLabel, enterLabel, langLabel);

  return (
    <div class={classes}>
      {rows.map((row, rowIndex) => (
        <RowKeys
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          disabled={disabled}
          canSubmit={canSubmit}
          presses={presses}
          banned={banned}
          labels={labels}
          onKeyPress={press}
        />
      ))}
    </div>
  );
}

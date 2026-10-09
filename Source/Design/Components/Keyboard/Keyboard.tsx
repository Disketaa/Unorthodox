import { useCallback, useMemo, useState } from 'preact/hooks';
import styles from './Keyboard.module.css';
import { useHardwareTyping } from './HardwareKeys';
import { columnsOf, Layouts, otherLang, type KeyboardLang } from './KeyboardLayouts';
import { keyNamer } from './KeyNamer';
import { RowKeys } from './KeyboardRow';

export type KeyboardKey = string | 'Backspace' | 'Space' | 'Enter' | 'Lang';

/** The keys that are not letters. Each carries only its own name, since a screen reader reads
 * the label beside it and a character on the key would say the same thing twice. */
export const Backspace = { key: 'Backspace' } as const;
export const Space = { key: 'Space' } as const;
export const Enter = { key: 'Enter' } as const;
export const Lang = { key: 'Lang' } as const;

export interface KeyboardProps {
  disabled?: boolean;
  /** Whether enter can send what is typed. Drives the one key that sends rather than types,
   * which is drawn and animated only while it can: a send key that breathes on an empty draft
   * promises something it cannot do. */
  canSubmit?: boolean;
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
  langLabel: string,
): Record<'Backspace' | 'Space' | 'Enter' | 'Lang', string> {
  return useMemo(
    () => ({ Backspace: backspaceLabel, Space: spaceLabel, Enter: enterLabel, Lang: langLabel }),
    [backspaceLabel, spaceLabel, enterLabel, langLabel],
  );
}

type Presses = Readonly<Record<string, number>>;

/** What one press does: count it against the key that was pressed, and hand it on. The count is
 * what plays the pop, so a tap and a held key move the key the same way and exactly once. */
function usePress(
  lang: KeyboardLang,
  setLang: (lang: KeyboardLang) => void,
  setPresses: (next: (current: Presses) => Presses) => void,
  onKeyPress: ((key: KeyboardKey) => void) | undefined,
): (key: KeyboardKey) => void {
  return useCallback(
    (key: KeyboardKey) => {
      if (key === Lang.key) {
        setLang(otherLang(lang));
        return;
      }
      setPresses((current) => ({ ...current, [key]: (current[key] ?? 0) + 1 }));
      onKeyPress?.(key);
    },
    [lang, setLang, onKeyPress, setPresses],
  );
}

/** The on-screen letter keys of the writing phase, in Russian or English. The language is held
 * here rather than asked for, since it is a fact about the keys and nothing else in the game
 * reads it: the draft is a string and a letter is a letter whichever set it came from. */
export function Keyboard({
  disabled = false,
  canSubmit = false,
  onKeyPress,
  backspaceLabel,
  spaceLabel,
  enterLabel,
  langLabel,
}: KeyboardProps) {
  const [lang, setLang] = useState<KeyboardLang>('ru');
  const [presses, setPresses] = useState<Readonly<Record<string, number>>>({});
  const rows = Layouts[lang];
  const columns = columnsOf(rows);
  const classes = [styles.Root, styles[`Columns${columns}`]].join(' ');
  const name = useMemo(() => keyNamer(rows), [lang]);
  const press = usePress(lang, setLang, setPresses, onKeyPress);
  useHardwareTyping(!disabled, name, press);
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
          labels={labels}
          onKeyPress={press}
        />
      ))}
    </div>
  );
}

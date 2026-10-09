import { useMemo, useState } from 'preact/hooks';
import styles from './Keyboard.module.css';
import { Key } from './KeyboardKey';
import { useHeldKeys } from './UseHeldKeys';
import { Layouts, otherLang, type KeyboardLang } from './KeyboardLayouts';
import { keyNamer } from './KeyNamer';

export type KeyboardKey = string | 'Backspace' | 'Space' | 'Enter' | 'Lang';

/** The row each of the keys that are not letters sits at the end of: backspace on the third row,
 * and the language, the space bar and enter on the fourth, which is the row a thumb rests on. */
const BackspaceRow = 2;
const BottomRow = 3;

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
  /** Letter or one of the named keys pressed. The layout itself holds no text, so the field
   * being typed into stays the single place a draft exists. */
  onKeyPress?: (key: KeyboardKey) => void;
  /** Read out by a screen reader on the keys that carry a glyph rather than a letter. */
  backspaceLabel: string;
  spaceLabel: string;
  enterLabel: string;
  langLabel: string;
}

interface RowProps {
  row: readonly string[];
  rowIndex: number;
  disabled: boolean;
  canSubmit: boolean;
  held: ReadonlySet<string>;
  labels: Record<'Backspace' | 'Space' | 'Enter' | 'Lang', string>;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** The letters of one row, which is all the row holds when no named key belongs to it. */
function Letters({ row, disabled, held, onKeyPress }: RowProps) {
  return (
    <>
      {row.map((letter) => (
        <Key
          key={letter}
          keyName={letter}
          disabled={disabled}
          pressed={held.has(letter)}
          onKeyPress={onKeyPress}
        />
      ))}
    </>
  );
}

/** The row a thumb rests on: the language, the space bar and enter. The language key draws the
 * same mark whichever set is up, since it points at the other one rather than naming either. */
function BottomKeys({ disabled, canSubmit, held, labels, onKeyPress }: RowProps) {
  return (
    <>
      <Key
        keyName={Lang.key}
        icon={styles.MarkLang}
        label={labels.Lang}
        extra={styles.Action}
        disabled={disabled}
        pressed={held.has(Lang.key)}
        onKeyPress={onKeyPress}
      />
      <Key
        keyName={Space.key}
        icon={styles.MarkSpace}
        label={labels.Space}
        extra={styles.Space}
        disabled={disabled}
        pressed={held.has(Space.key)}
        onKeyPress={onKeyPress}
      />
      <Key
        keyName={Enter.key}
        icon={styles.MarkEnter}
        label={labels.Enter}
        extra={[styles.Action, canSubmit ? styles.MarkSend : ''].filter(Boolean).join(' ')}
        disabled={disabled}
        pressed={held.has(Enter.key)}
        onKeyPress={onKeyPress}
      />
    </>
  );
}

/** The keys that are not letters, at the end of the row they belong to. Each draws its own mark
 * rather than a character: the blob face has none of these three, so they rendered as tofu. */
function NamedKeys(props: RowProps) {
  const { rowIndex, disabled, held, labels, onKeyPress } = props;
  return (
    <>
      {rowIndex === BackspaceRow && (
        <Key
          keyName={Backspace.key}
          icon={styles.MarkBackspace}
          label={labels.Backspace}
          extra={styles.Action}
          disabled={disabled}
          pressed={held.has(Backspace.key)}
          onKeyPress={onKeyPress}
        />
      )}
      {rowIndex === BottomRow && <BottomKeys {...props} />}
    </>
  );
}

/** A row of letters, closed by whichever named key belongs at the end of that row. */
function RowKeys(props: RowProps) {
  return (
    <div class={styles.Row}>
      <Letters {...props} />
      <NamedKeys {...props} />
    </div>
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
  const rows = Layouts[lang];
  // Held across renders on the letters rather than rebuilt each time, since the effect under it
  // would otherwise take the keyboard's keys back off and put them on again every frame.
  const name = useMemo(() => keyNamer(new Set(rows.flat())), [lang]);
  const held = useHeldKeys(!disabled, name);
  const labels = { Backspace: backspaceLabel, Space: spaceLabel, Enter: enterLabel, Lang: langLabel };

  const press = (key: KeyboardKey) => {
    if (key === Lang.key) {
      setLang(otherLang(lang));
      return;
    }
    onKeyPress?.(key);
  };

  return (
    <div class={styles.Root}>
      {rows.map((row, rowIndex) => (
        <RowKeys
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          disabled={disabled}
          canSubmit={canSubmit}
          held={held}
          labels={labels}
          onKeyPress={press}
        />
      ))}
    </div>
  );
}

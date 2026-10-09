import styles from './Keyboard.module.css';
import { Key } from './KeyboardKey';
import { useHeldKeys } from './UseHeldKeys';

export type KeyboardKey = string | 'Backspace' | 'Space' | 'Enter';

/** ЙЦУКЕН, in the rows a Russian player expects to find them in, and the QWERTY arrangement
 * rather than a grid of equal rows. The fourth row is empty: it carries the space bar and
 * enter, which are not letters. */
export const Rows: readonly (readonly string[])[] = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
  [],
];

/** The row each of the keys that are not letters sits at the end of: backspace on the third row,
 * and enter with the space bar on the fourth, which is where every keyboard a thumb is used to
 * has them. */
const BackspaceRow = 2;
const EnterRow = 3;

/** What each non-letter key draws and what a screen reader reads for it. The glyph rather than
 * the name on the key, since the letters are the only part a player reads at a glance. */
export const Backspace = { glyph: '⌫', key: 'Backspace' } as const;
export const Space = { glyph: '␣', key: 'Space' } as const;
export const Enter = { glyph: '⏎', key: 'Enter' } as const;

export interface KeyboardProps {
  disabled?: boolean;
  /** Letter or one of the named keys pressed. The layout itself holds no text, so the field
   * being typed into stays the single place a draft exists. */
  onKeyPress?: (key: KeyboardKey) => void;
  /** Read out by a screen reader on the keys that carry a glyph rather than a letter. */
  backspaceLabel: string;
  spaceLabel: string;
  enterLabel: string;
}

interface RowProps {
  row: readonly string[];
  rowIndex: number;
  disabled: boolean;
  held: ReadonlySet<KeyboardKey>;
  labels: Record<'Backspace' | 'Space' | 'Enter', string>;
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

/** The keys that are not letters, at the end of the row they belong to. The fourth row holds
 * both the space bar and enter, since that is the row a thumb rests on. */
function NamedKeys({ rowIndex, disabled, held, labels, onKeyPress }: RowProps) {
  return (
    <>
      {rowIndex === BackspaceRow && (
        <Key
          keyName={Backspace.key}
          glyph={Backspace.glyph}
          label={labels.Backspace}
          extra={styles.Action}
          disabled={disabled}
          pressed={held.has(Backspace.key)}
          onKeyPress={onKeyPress}
        />
      )}
      {rowIndex === EnterRow && (
        <>
          <Key
            keyName={Space.key}
            glyph={Space.glyph}
            label={labels.Space}
            extra={styles.Space}
            disabled={disabled}
            pressed={held.has(Space.key)}
            onKeyPress={onKeyPress}
          />
          <Key
            keyName={Enter.key}
            glyph={Enter.glyph}
            label={labels.Enter}
            extra={styles.Action}
            disabled={disabled}
            pressed={held.has(Enter.key)}
            onKeyPress={onKeyPress}
          />
        </>
      )}
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

/** The on-screen letter keys of the writing phase. */
export function Keyboard({
  disabled = false,
  onKeyPress,
  backspaceLabel,
  spaceLabel,
  enterLabel,
}: KeyboardProps) {
  const held = useHeldKeys(!disabled);
  const labels = { Backspace: backspaceLabel, Space: spaceLabel, Enter: enterLabel };

  return (
    <div class={styles.Root}>
      {Rows.map((row, rowIndex) => (
        <RowKeys
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          disabled={disabled}
          held={held}
          labels={labels}
          onKeyPress={onKeyPress}
        />
      ))}
    </div>
  );
}

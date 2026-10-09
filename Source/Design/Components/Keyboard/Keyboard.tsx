import { useEffect, useState } from 'preact/hooks';
import styles from './Keyboard.module.css';
import { Key } from './KeyboardKey';
import type { KeyProps } from './KeyboardKey';

export type KeyboardKey = string | 'Backspace' | 'Space' | 'Enter';

/** ЙЦУКЕН, the letters in the rows a Russian player expects to find them in. The shape is the
 * QWERTY arrangement rather than a grid of equal rows, so the rows a hand knows from a desktop
 * keyboard land where the fingers expect them. The fourth row is empty: it carries the space bar
 * and enter, which are not letters. */
const Rows: readonly (readonly string[])[] = [
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
const Backspace = { glyph: '⌫', key: 'Backspace' } as const;
const Space = { glyph: '␣', key: 'Space' } as const;
const Enter = { glyph: '⏎', key: 'Enter' } as const;

export interface KeyboardProps {
  disabled?: boolean;
  /** Letter or one of the named keys pressed. The layout itself holds no text, so the field being
   * typed into stays the single place a draft exists. */
  onKeyPress?: (key: KeyboardKey) => void;
  /** Read out by a screen reader on the keys that carry a glyph rather than a letter. */
  backspaceLabel: string;
  spaceLabel: string;
  enterLabel: string;
}

/** What the layout calls the key a physical keydown names. `event.key` for a letter arrives
 * lowercase, and only the layout's own letters are answered, so a key the layout does not draw
 * lights nothing rather than a key that is not there. */
function keyFor(event: KeyboardEvent): KeyboardKey | undefined {
  if (event.key === 'Backspace') return Backspace.key;
  if (event.key === ' ') return Space.key;
  if (event.key === 'Enter') return Enter.key;
  const letter = event.key.toUpperCase();
  return Rows.some((row) => row.includes(letter)) ? letter : undefined;
}

/** Which keys a hardware keyboard is holding down right now, so that pressing one is seen on the
 * on-screen layout too. Held as a set rather than a single key because a hand can have two down
 * at once while typing quickly. */
function useHeldKeys(enabled: boolean): ReadonlySet<KeyboardKey> {
  const [held, setHeld] = useState<ReadonlySet<KeyboardKey>>(() => new Set());

  useEffect(() => {
    if (!enabled) return;
    const set = (key: KeyboardKey, down: boolean) =>
      setHeld((current) => {
        if (current.has(key) === down) return current;
        const next = new Set(current);
        if (down) next.add(key);
        else next.delete(key);
        return next;
      });
    const onDown = (event: KeyboardEvent) => {
      const key = keyFor(event);
      if (key !== undefined) set(key, true);
    };
    const onUp = (event: KeyboardEvent) => {
      const key = keyFor(event);
      if (key !== undefined) set(key, false);
    };
    // A keydown whose keyup arrives after the window has lost focus would otherwise stay held
    // forever, so losing focus releases everything.
    const onBlur = () => setHeld(new Set());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled]);

  return held;
}

interface RowProps {
  row: readonly string[];
  rowIndex: number;
  disabled: boolean;
  held: ReadonlySet<KeyboardKey>;
  labels: Record<'Backspace' | 'Space' | 'Enter', string>;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** A row of letters, closed by whichever named key belongs at the end of that row. The fourth
 * row holds both the space bar and enter, since that is the row a thumb rests on. */
function RowKeys({ row, rowIndex, disabled, held, labels, onKeyPress }: RowProps) {
  return (
    <div class={styles.Row}>
      {row.map((letter) => (
        <Key
          key={letter}
          keyName={letter}
          disabled={disabled}
          pressed={held.has(letter)}
          onKeyPress={onKeyPress}
        />
      ))}
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

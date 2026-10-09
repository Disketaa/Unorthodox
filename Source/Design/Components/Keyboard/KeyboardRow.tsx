import styles from './Keyboard.module.css';
import { Backspace, Enter, Space, type KeyboardKey } from './Keyboard';
import { Key, LangKey } from './KeyboardKey';
import { Slots } from './KeyboardLayouts';

/** The row each of the keys that are not letters sits at the end of: backspace on the third row,
 * and the language, the space bar and enter on the fourth, which is the row a thumb rests on. */
const BackspaceRow = 2;
const BottomRow = 3;

/** What every part of a row is passed. The column count is not one of them: only the whole
 * keyboard divides itself by it, and a row takes its width from the keys inside. */
export interface RowProps {
  row: readonly string[];
  rowIndex: number;
  disabled: boolean;
  canSubmit: boolean;
  presses: Readonly<Record<string, number>>;
  labels: Record<'Backspace' | 'Space' | 'Enter' | 'Lang', string>;
  onKeyPress?: (key: KeyboardKey) => void;
}

/** How many times the key in this slot has been pressed. */
function count(presses: RowProps['presses'], slot: string): number {
  return presses[slot] ?? 0;
}

/** A row of letters, closed by whichever named key belongs at the end of that row. Every key is
 * the same width in every row, so a short row can be centred and still line up with the letters
 * above it. The bottom row stretches instead, holding no letters to line up with. */
export function RowKeys(props: RowProps) {
  return (
    <div class={props.rowIndex === BottomRow ? styles.Bottom : styles.Row}>
      <Letters {...props} />
      <NamedKeys {...props} />
    </div>
  );
}

/** The letters of one row, which is all the row holds when no named key belongs to it. */
function Letters({ row, rowIndex, disabled, presses, onKeyPress }: RowProps) {
  return (
    <>
      {row.map((letter, column) => {
        const slot = `${rowIndex}.${column}`;
        const pressCount = count(presses, slot);
        return (
          <Key
            key={slot}
            keyName={letter}
            pressCount={pressCount}
            disabled={disabled}
            onKeyPress={onKeyPress}
          />
        );
      })}
    </>
  );
}

/** The keys that are not letters, at the end of the row they belong to. Each draws its own mark
 * rather than a character: the blob face has none of these, so they rendered as tofu. */
function NamedKeys(props: RowProps) {
  const { rowIndex, disabled, presses, labels, onKeyPress } = props;
  const pressCount = count(presses, Slots.Backspace);
  return (
    <>
      {rowIndex === BackspaceRow && (
        <Key
          key={Slots.Backspace}
          keyName={Backspace.key}
          pressCount={pressCount}
          icon={styles.MarkBackspace}
          label={labels.Backspace}
          extra={styles.Action}
          disabled={disabled}
          onKeyPress={onKeyPress}
        />
      )}
      {rowIndex === BottomRow && <BottomKeys {...props} />}
    </>
  );
}

/** The row a thumb rests on: the language, the space bar and enter. The language key draws the
 * same mark whichever set is up, since it points at the other one rather than naming either. */
function BottomKeys({ disabled, canSubmit, presses, labels, onKeyPress }: RowProps) {
  return (
    <>
      <LangKey
        key={Slots.Lang}
        pressCount={count(presses, Slots.Lang)}
        icon={styles.MarkLang}
        label={labels.Lang}
        extra={styles.Action}
        disabled={disabled}
        onKeyPress={onKeyPress}
      />
      <Key
        key={Slots.Space}
        keyName={Space.key}
        pressCount={count(presses, Slots.Space)}
        icon={styles.MarkSpace}
        label={labels.Space}
        extra={styles.Space}
        disabled={disabled}
        onKeyPress={onKeyPress}
      />
      <Key
        key={Slots.Enter}
        keyName={Enter.key}
        pressCount={count(presses, Slots.Enter)}
        icon={styles.MarkEnter}
        label={labels.Enter}
        extra={[styles.Action, canSubmit ? styles.MarkSend : ''].filter(Boolean).join(' ')}
        disabled={disabled}
        onKeyPress={onKeyPress}
      />
    </>
  );
}

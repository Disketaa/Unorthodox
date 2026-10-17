/** Syntax-highlighted JSON over a transparent text area: the text area owns the text and caret,
 * so an edit is never re-rendered over by the framework. */
import { useRef } from 'preact/hooks';
import { IconButton } from '@/Design/Components';
import { Strings } from '@/Content';
import { highlightJson } from './JsonHighlight';
import { applyJsonEnter } from './JsonEnterHandler';
import { applyJsonBackspace, placeCaret } from './JsonCaret';
import styles from './CustomThemesPopup.module.css';

export interface SyntaxHighlightedJsonProps {
  json: string;
  onChange: (value: string) => void;
  onPaste?: (text: string) => string | undefined;
  /** Emptying the box in one press, which is how a theme is struck out. Absent where there is
   * nothing in the box to empty. */
  onClear?: () => void;
  color?: string;
  /** Whether the text in the box is not a theme list, which washes the box in the feedback pink
   * rather than only saying so in the banner below it. */
  invalid?: boolean;
  label?: string;
}

/** Enter and Backspace both edit the text as a whole rather than letting the browser insert a
 * character: the box is JSON, and both keys mean something in JSON that is not a character. */
function handleJsonKeyDown(event: KeyboardEvent, onChange: (next: string) => void): void {
  if (event.key !== 'Enter' && event.key !== 'Backspace') return;
  event.preventDefault();
  const target = event.currentTarget;
  if (!(target instanceof HTMLTextAreaElement)) return;
  const { value, selectionStart, selectionEnd } = target;
  if (selectionStart === undefined || selectionEnd === undefined) return;
  const { text, caret } =
    event.key === 'Enter'
      ? applyJsonEnter(value, selectionStart, selectionEnd)
      : applyJsonBackspace(value, selectionStart, selectionEnd);
  target.value = text;
  target.setSelectionRange(caret, caret);
  onChange(text);
}

/** A click, so that landing on an empty string lands inside it. Read after the browser has put
 * the caret where the click asked, and only when the click did not drag a selection. */
function handleJsonClick(event: MouseEvent): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLTextAreaElement)) return;
  if (target.selectionStart !== target.selectionEnd) return;
  const caret = placeCaret(target.value, target.selectionStart ?? 0);
  if (caret === target.selectionStart) return;
  target.setSelectionRange(caret, caret);
}

function handleJsonInput(event: Event, onChange: (value: string) => void): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLTextAreaElement)) return;
  onChange(target.value);
}

function handleJsonPaste(
  event: ClipboardEvent,
  onPaste: SyntaxHighlightedJsonProps['onPaste'],
  onChange: (value: string) => void
): void {
  const pasted = event.clipboardData?.getData('text');
  if (pasted === undefined) return;
  const repaired = onPaste?.(pasted);
  if (repaired === undefined) return;
  event.preventDefault();
  onChange(repaired);
}

function handleJsonScroll(event: Event, preRef: { current: HTMLPreElement | null }): void {
  const target = event.currentTarget;
  const pre = preRef.current;
  if (!(target instanceof HTMLTextAreaElement) || !pre) return;
  pre.scrollTop = target.scrollTop;
  pre.scrollLeft = target.scrollLeft;
}

function ClearButton({ onClear }: { onClear?: () => void }) {
  if (onClear === undefined) return null;
  return (
    <div class={styles.Clear}>
      <IconButton
        icon="Trash"
        size="Small"
        variant="Ghost"
        label={Strings.lobby.settings.customThemesClear}
        onClick={onClear ?? (() => undefined)}
      />
    </div>
  );
}

export function SyntaxHighlightedJson({
  json,
  onChange,
  onPaste,
  onClear,
  color,
  invalid = false,
  label,
}: SyntaxHighlightedJsonProps) {
  const preRef = useRef<HTMLPreElement>(null);
  return (
    <div
      class={`${styles.Editor} ${invalid ? styles.Invalid : ''}`}
      style={{ '--String-Color': color }}
    >
      <pre ref={preRef} class={styles.Text} aria-hidden="true">
        {highlightJson(json)}
      </pre>
      <textarea
        class={styles.Input}
        value={json}
        wrap="off"
        spellcheck={false}
        aria-label={label}
        onInput={(event) => handleJsonInput(event, onChange)}
        onKeyDown={(event) => handleJsonKeyDown(event, onChange)}
        onClick={(event) => handleJsonClick(event)}
        onPaste={(event) => handleJsonPaste(event, onPaste, onChange)}
        onScroll={(event) => handleJsonScroll(event, preRef)}
      />
      <ClearButton onClear={onClear} />
    </div>
  );
}

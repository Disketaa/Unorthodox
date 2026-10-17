/** Syntax-highlighted JSON over a transparent text area: the text area owns the text and caret,
 * so an edit is never re-rendered over by the framework. */
import { useRef } from 'preact/hooks';
import { IconButton } from '@/Design/Components';
import { Strings } from '@/Content';
import { highlightJson } from './JsonHighlight';
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

function handleJsonKeyDown(event: KeyboardEvent, onChange: (next: string) => void): void {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const target = event.currentTarget;
  if (!(target instanceof HTMLTextAreaElement)) return;
  const { value, selectionStart, selectionEnd } = target;
  if (selectionStart === undefined || selectionEnd === undefined) return;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const indent = value.slice(lineStart, selectionStart).match(/^[ \t]*/)?.[0] ?? '';
  const next = value.slice(0, selectionStart) + '\n' + indent + value.slice(selectionEnd);
  target.value = next;
  const caret = selectionStart + 1 + indent.length;
  target.setSelectionRange(caret, caret);
  onChange(next);
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
        onPaste={(event) => handleJsonPaste(event, onPaste, onChange)}
        onScroll={(event) => handleJsonScroll(event, preRef)}
      />
      <ClearButton onClear={onClear} />
    </div>
  );
}

/** Syntax-highlighted JSON using the project's color tokens, with the chosen theme's tint on
 * strings. The editor is a highlighted layer under a transparent text area: the text area owns
 * the text and the caret, so an edit is never re-rendered over by the framework (which is what
 * duplicates characters in a contentEditable element). */
import { useRef } from 'preact/hooks';
import { type JSX } from 'preact';
import styles from './CustomThemesPopup.module.css';

export interface SyntaxHighlightedJsonProps {
  json: string;
  onChange: (value: string) => void;
  onPaste?: (text: string) => string | undefined;
  color?: string;
  /** Whether the text in the box is not a theme list, which washes the box in the feedback pink
   * rather than only saying so in the banner below it. */
  invalid?: boolean;
  label?: string;
}

export function SyntaxHighlightedJson({
  json,
  onChange,
  onPaste,
  color,
  invalid = false,
  label,
}: SyntaxHighlightedJsonProps) {
  const preRef = useRef<HTMLPreElement>(null);

  const handleInput = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLTextAreaElement)) return;
    onChange(target.value);
  };

  const handlePaste = (event: ClipboardEvent): void => {
    const pasted = event.clipboardData?.getData('text');
    if (pasted === undefined) return;
    const repaired = onPaste?.(pasted);
    if (repaired === undefined) return;
    event.preventDefault();
    onChange(repaired);
  };

  const handleScroll = (event: Event): void => {
    const target = event.currentTarget;
    const pre = preRef.current;
    if (!(target instanceof HTMLTextAreaElement) || !pre) return;
    pre.scrollTop = target.scrollTop;
    pre.scrollLeft = target.scrollLeft;
  };

  return (
    <div class={`${styles.Editor} ${invalid ? styles.Invalid : ''}`} style={{ '--String-Color': color }}>
      <pre ref={preRef} class={styles.Text} aria-hidden="true">
        {highlightJson(json)}
      </pre>
      <textarea
        class={styles.Input}
        value={json}
        wrap="off"
        spellcheck={false}
        aria-label={label}
        onInput={handleInput}
        onPaste={handlePaste}
        onScroll={handleScroll}
      />
    </div>
  );
}

function highlightJson(json: string): JSX.Element[] {
  // A trailing space keeps the last empty line tall, so the highlight tracks the caret down.
  const source = json.endsWith('\n') ? `${json} ` : json;
  const tokens: JSX.Element[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < source.length && source[j] !== '"') {
        if (source[j] === '\\' && j + 1 < source.length) j += 2;
        else j++;
      }
      const str = source.slice(i, j + 1);
      const isKey = j + 1 < source.length && source[j + 1] === ':';
      tokens.push(
        <span key={i} class={isKey ? styles.Key : styles.String}>
          {str}
        </span>
      );
      i = j + 1;
    } else if (/[0-9-]/.test(ch)) {
      let j = i + 1;
      while (j < source.length && /[0-9.eE+-]/.test(source[j])) j++;
      tokens.push(<span key={i} class={styles.Number}>{source.slice(i, j)}</span>);
      i = j;
    } else if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ':' || ch === ',') {
      tokens.push(<span key={i} class={styles.Punct}>{ch}</span>);
      i++;
    } else if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t') {
      tokens.push(<span key={i} class={styles.Whitespace}>{ch}</span>);
      i++;
    } else {
      tokens.push(<span key={i}>{ch}</span>);
      i++;
    }
  }
  return tokens;
}
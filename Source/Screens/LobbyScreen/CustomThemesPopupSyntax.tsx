/** Syntax-highlighted JSON display using the project's color tokens.
 * Renders a JSON string with colored spans for keys, strings, numbers, and punctuation.
 */
import styles from './CustomThemesPopup.module.css';

export interface SyntaxHighlightedJsonProps {
  json: string;
  onChange: (value: string) => void;
}

export function SyntaxHighlightedJson({ json, onChange }: SyntaxHighlightedJsonProps) {
  const highlighted = highlightJson(json);
  return (
    <pre
      class={styles.Text}
      contentEditable
      suppressContentEditableWarning
      spellcheck={false}
      onInput={(event) => {
        const target = event.currentTarget;
        const text = target.textContent ?? '';
        onChange(text);
      }}
    >
      {highlighted}
    </pre>
  );
}

function highlightJson(json: string): JSX.Element[] {
  const tokens: JSX.Element[] = [];
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '"') {
      // String token
      let j = i + 1;
      while (j < json.length && json[j] !== '"') {
        if (json[j] === '\\' && j + 1 < json.length) j += 2;
        else j++;
      }
      const str = json.slice(i, j + 1);
      const isKey = j + 1 < json.length && json[j + 1] === ':';
      tokens.push(
        <span key={i} class={isKey ? styles.Key : styles.String}>
          {str}
        </span>
      );
      i = j + 1;
    } else if (/[0-9-]/.test(ch)) {
      // Number token
      let j = i + 1;
      while (j < json.length && /[0-9.eE+-]/.test(json[j])) j++;
      tokens.push(<span key={i} class={styles.Number}>{json.slice(i, j)}</span>);
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

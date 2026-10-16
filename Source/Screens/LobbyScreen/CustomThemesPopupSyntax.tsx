/** Syntax-highlighted JSON using the project's color tokens, with the chosen theme's tint on
 * strings. The text area is contentEditable, so the cursor position is saved before each
 * re-render and restored after, otherwise typing duplicates characters. */
import { useEffect, useRef } from 'preact/hooks';
import { type JSX } from 'preact';
import styles from './CustomThemesPopup.module.css';

export interface SyntaxHighlightedJsonProps {
  json: string;
  onChange: (value: string) => void;
  color?: string;
}

export function SyntaxHighlightedJson({ json, onChange, color }: SyntaxHighlightedJsonProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const selRef = useRef<{ anchor: number; focus: number } | null>(null);

  const handleInput = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof Element)) return;
    captureSelection(preRef, selRef);
    onChange(target.textContent ?? '');
  };

  useEffect(() => {
    applySelection(preRef, selRef);
  });

  return (
    <pre
      ref={preRef}
      class={styles.Text}
      contentEditable
      spellcheck={false}
      style={{ '--String-Color': color }}
      onInput={handleInput}
    >
      {highlightJson(json)}
    </pre>
  );
}

function captureSelection(
  preRef: { current: HTMLPreElement | null },
  selRef: { current: { anchor: number; focus: number } | null },
): void {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !preRef.current) return;
  const range = sel.getRangeAt(0);
  const root = preRef.current;
  let charIndex = 0;
  let anchor = -1;
  let focus = -1;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (anchor === -1 && node === range.startContainer) anchor = charIndex + range.startOffset;
      if (focus === -1 && node === range.endContainer) focus = charIndex + range.endOffset;
      charIndex += len;
      return anchor !== -1 && focus !== -1;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i])) return true;
    }
    return false;
  };
  walk(root);
  if (anchor !== -1 && focus !== -1) selRef.current = { anchor, focus };
}

function applySelection(
  preRef: { current: HTMLPreElement | null },
  selRef: { current: { anchor: number; focus: number } | null },
): void {
  if (!selRef.current || !preRef.current) return;
  const { anchor, focus } = selRef.current;
  const root = preRef.current;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  const range = document.createRange();
  let charIndex = 0;
  let foundAnchor = false;
  let foundFocus = false;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (!foundAnchor && charIndex + len >= anchor) {
        range.setStart(node, anchor - charIndex);
        foundAnchor = true;
      }
      if (!foundFocus && charIndex + len >= focus) {
        range.setEnd(node, focus - charIndex);
        foundFocus = true;
      }
      charIndex += len;
      return foundAnchor && foundFocus;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i])) return true;
    }
    return false;
  };
  walk(root);
  sel.addRange(range);
  selRef.current = null;
}

function highlightJson(json: string): JSX.Element[] {
  const tokens: JSX.Element[] = [];
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '"') {
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

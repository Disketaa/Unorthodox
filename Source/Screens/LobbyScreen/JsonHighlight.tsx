/** Syntax-highlights JSON text into Preact elements. Each token kind is painted by a small pure
 * function so none of them grows past the line budget. */
import { type JSX } from 'preact';
import styles from './CustomThemesPopup.module.css';

function highlightString(source: string, i: number, tokens: JSX.Element[]): number {
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
  return j + 1;
}

function highlightNumber(source: string, i: number, tokens: JSX.Element[]): number {
  let j = i + 1;
  while (j < source.length && /[0-9.eE+-]/.test(source[j])) j++;
  tokens.push(
    <span key={i} class={styles.Number}>
      {source.slice(i, j)}
    </span>
  );
  return j;
}

function highlightPunct(ch: string, i: number, tokens: JSX.Element[]): number {
  tokens.push(
    <span key={i} class={styles.Punct}>
      {ch}
    </span>
  );
  return i + 1;
}

function highlightWhitespace(ch: string, i: number, tokens: JSX.Element[]): number {
  tokens.push(
    <span key={i} class={styles.Whitespace}>
      {ch}
    </span>
  );
  return i + 1;
}

function highlightOther(ch: string, i: number, tokens: JSX.Element[]): number {
  tokens.push(<span key={i}>{ch}</span>);
  return i + 1;
}

/** A trailing space keeps the last empty line tall, so the highlight tracks the caret down. */
export function highlightJson(json: string): JSX.Element[] {
  const source = json.endsWith('\n') ? `${json} ` : json;
  const tokens: JSX.Element[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"') {
      i = highlightString(source, i, tokens);
    } else if (/[0-9-]/.test(ch)) {
      i = highlightNumber(source, i, tokens);
    } else if (
      ch === '{' ||
      ch === '}' ||
      ch === '[' ||
      ch === ']' ||
      ch === ':' ||
      ch === ','
    ) {
      i = highlightPunct(ch, i, tokens);
    } else if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t') {
      i = highlightWhitespace(ch, i, tokens);
    } else {
      i = highlightOther(ch, i, tokens);
    }
  }
  return tokens;
}

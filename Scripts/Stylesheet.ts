import { readFileSync } from 'node:fs';

/**
 * Reading a stylesheet for a test, rather than rendering it.
 *
 * happy-dom does not lay out a grid, does not resolve a `minmax`, and does not match a
 * width query, so a rendered component asserts nothing about the thing a stylesheet
 * exists to decide. What can be checked is the declaration, which is where the behaviour
 * actually lives.
 *
 * Comments come out first because every one of these files explains most of itself, and
 * a parser reading the text as written would treat the end of a comment as the end of a
 * declaration and quietly skip the one after it.
 *
 * Selectors are matched as patterns rather than as names, because the ones worth
 * asserting on are often child combinators, and escaping those would be a second
 * spelling of the same selector. A pattern is expected to capture the rule body, so
 * `ruleBody(/\.Root\s*\{([^}]*)\}/)` rather than a name.
 */
export function readStylesheet(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

export interface Stylesheet {
  /** The whole file, comments removed and formatting as written. */
  text: string;
  /** The same file with every run of whitespace removed, for comparing a value. */
  flat: string;
  /** The body of one rule, without the braces and with its whitespace gone. */
  ruleBody(selector: RegExp): string;
  /** One declaration out of a rule body, with its whitespace gone. */
  declaration(selector: RegExp, property: string): string;
  /** Whether a rule sets a property at all, matched whole: `width` is not `min-width`. */
  declares(selector: RegExp, property: string): boolean;
}

export function stylesheet(relativePath: string): Stylesheet {
  const text = readStylesheet(relativePath);
  const flat = text.replace(/\s+/g, '');

  function ruleBody(selector: RegExp): string {
    const match = text.match(selector);
    if (match?.[1] === undefined) throw new Error(`no rule for ${selector.source}`);
    // Whitespace goes because Prettier wraps a long `calc()` across lines and puts
    // spaces inside the parentheses it breaks, so a value read verbatim is broken up in
    // ways that have nothing to do with what it says. The trailing `;` stays, so that
    // a caller matching a declaration still sees the separator the property ends on.
    return match[1].replace(/\s+/g, '');
  }

  function declares(selector: RegExp, property: string): boolean {
    return new RegExp(`(?:^|;)\\s*${property}\\s*:`, 'i').test(ruleBody(selector));
  }

  function declaration(selector: RegExp, property: string): string {
    const match = ruleBody(selector).match(new RegExp(`(?:^|;)\\s*${property}\\s*:([^;]+);`, 'i'));
    if (match?.[1] === undefined) throw new Error(`no ${property} on ${selector.source}`);
    return match[1].replace(/\s+/g, '');
  }

  return { text, flat, ruleBody, declaration, declares };
}

/**
 * The value a CSS custom property resolves to, following a `var()` to its target.
 *
 * The token file rather than a rendered value, so a test can ask what a token *is* on
 * paper, which is the question these tests are about.
 */
export function tokenReader(tokens: string): (name: string) => string {
  function tokenValue(name: string, depth = 0): string {
    const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`, 'i'));
    if (match?.[1] === undefined) throw new Error(`no token found for ${name}`);
    const reference = match[1].trim().match(/^var\((--[a-z-]+)\)$/i);
    if (reference?.[1] === undefined) return match[1].trim();
    if (depth > 4) throw new Error(`var() chain too deep at ${name}`);
    return tokenValue(reference[1], depth + 1);
  }
  return tokenValue;
}

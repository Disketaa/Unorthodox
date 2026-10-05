/** Type surface for `CommentShape.mjs`. The shape is shared by three callers on both sides of
 * the language boundary — an ESLint plugin, a Node formatter and a TypeScript audit — so the
 * module stays `.mjs` (plain JS, no build step) and this file declares what it exports. */
export const PRINT_WIDTH: number;

/** Rewrap one paragraph to a width, breaking only at spaces. */
export function reflow(text: string, width: number): string[];

/** Flatten a comment's body to one paragraph. */
export function flatten(value: string): string;

/** The canonical text for a comment with the given body and indentation, or `null` when the
 * body is empty. */
export function canonicalShape(
  value: string,
  indent: string,
  eol?: string,
  doc?: boolean,
): string | null;

/** The same, for a comment sharing its line with code, which keeps its author's text. */
export function shapeForLine(
  text: string,
  indent: string,
  eol: string,
  doc: boolean,
): string | null;

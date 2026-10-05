/** Type surface for `Mojibake.mjs`, the same arrangement as `CommentShape.d.mts`: plain JS shared
 * with an ESLint plugin that has no build step, with its exports declared so `tsc` can check the
 * audit that imports it. */
export const SIGNATURES: readonly RegExp[];

/** The first signature found in `text`, or `null` when the text is clean. */
export function findMojibake(
  text: string,
): { 0: string; index: number; length: number } | null;

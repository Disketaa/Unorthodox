import arrowSvg from './Arrow.svg?raw';
import fingerSvg from './Finger.svg?raw';
import textSvg from './Text.svg?raw';
import unavailableSvg from './Unavailable.svg?raw';

/**
 * The four drawn cursors, recoloured to a tint at runtime.
 *
 * `cursor` takes a URL and nothing else: there is no `mask` for it and no `fill`
 * that CSS can set, so the only way to tint one is to build the data URL with the
 * colour already in it. That is why this reads the files as text rather than letting
 * the stylesheet inline them.
 *
 * Only the white fill is swapped. Every cursor is drawn as a white body with a black
 * copy of the same path around it, which is what lets a cursor stay visible on the
 * paper; recolouring only the body tints the cursor and keeps the outline that draws
 * it against the page.
 */
const Files: { name: string; svg: string; hotspot: string; fallback: string }[] = [
  { name: '--Cursor-Default', svg: arrowSvg, hotspot: '4 0', fallback: 'default' },
  { name: '--Cursor-Pointer', svg: fingerSvg, hotspot: '12 0', fallback: 'pointer' },
  { name: '--Cursor-NotAllowed', svg: unavailableSvg, hotspot: '2 3', fallback: 'not-allowed' },
  { name: '--Cursor-Text', svg: textSvg, hotspot: '16 16', fallback: 'text' },
];

/**
 * The token values for one colour.
 *
 * The hotspot is restated here rather than read from the stylesheet, because the
 * stylesheet only has it for the black version and a tint that moved the aim point
 * would be worse than no tint at all. The four values are the ones already in
 * `Tokens.css`, which is where they are documented.
 */
export function cursorTokens(color: string): [string, string][] {
  return Files.map((file) => {
    // Only the white body is swapped, and the black outline is left alone. The app
    // is paper-coloured, so the body is the part that carries the tint and the black
    // is the part that keeps the cursor visible against it — the same arrangement as
    // a character, which is a tinted body under black linework.
    const tinted = file.svg.split('fill="white"').join(`fill="${color}"`);
    // `encodeURIComponent` leaves parentheses alone, and `Unavailable.svg` contains a
    // `url(#clip)` reference. A literal `)` inside a data URL ends it as far as the
    // `url()` token is concerned, which silently truncated that cursor to its opening
    // tag. Escaping them costs three characters and makes every URL paren-free.
    const encoded = encodeURIComponent(tinted).replace(/\(/g, '%28').replace(/\)/g, '%29');
    const url = `url("data:image/svg+xml,${encoded}") ${file.hotspot}, ${file.fallback}`;
    return [file.name, url];
  });
}

/**
 * Whether this device has a pointer the drawn cursors are for.
 *
 * The same condition the stylesheet uses to swap them in. It is checked here rather
 * than left to the stylesheet because a custom property written from JavaScript
 * applies everywhere it is read, which would hand a phone four cursor images it has
 * no way to draw and no reason to download.
 */
export function hasFinePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
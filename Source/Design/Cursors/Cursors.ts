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
 * Each file is one flat silhouette, so every `fill="black"` becomes the tint and
 * there is nothing else in the drawing to keep in step. The one white left in
 * `Unavailable.svg` is the rect inside its `clipPath`, which is a clipping shape and
 * is never painted.
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
/**
 * The four cursors are written unconditionally, and deliberately so.
 *
 * An earlier version asked `matchMedia` here and withheld the images on anything that
 * reported no fine pointer. That was guarding nothing — the files are imported as
 * text and travel in the bundle either way, and a device with no pointer never reads
 * `cursor` at all — and it could only ever suppress the feature: had the query
 * answered false for a reason the stylesheet did not share, the page would quietly
 * fall back to the black cursors with nothing to show for having tinted them.
 *
 * Which is what happened, and why the four are always written now.
 */
export function cursorTokens(color: string): [string, string][] {
  return Files.map((file) => {
    const tinted = file.svg.split('fill="black"').join(`fill="${color}"`);
    // `encodeURIComponent` leaves parentheses alone, and `Unavailable.svg` contains a
    // `url(#clip0_526_913)` reference. A literal `)` inside a data URL ends it as far
    // as the `url()` token is concerned, which silently truncated that cursor to its
    // opening tag. Escaping them makes every URL paren-free.
    const encoded = encodeURIComponent(tinted).replace(/\(/g, '%28').replace(/\)/g, '%29');
    return [file.name, `url("data:image/svg+xml,${encoded}") ${file.hotspot}, ${file.fallback}`];
  });
}

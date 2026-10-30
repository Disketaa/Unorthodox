/** What the writing measures at the size it is drawn, read in one go: each read is a layout. */
export interface TextMeasure {
  height: number;
  lines: number;
  width: number;
}

/** What the writing measures at the size it is drawn, read in one go: each read is a layout. The
 * width is the writing's own rather than the box around it, so a centred line that outgrows the
 * box — `scrollWidth` counts only the far side — is doubled back before it is compared. */
export function measureText(element: HTMLElement): TextMeasure {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const height = range.getBoundingClientRect().height;
  const lines = lineCount(range.getClientRects());
  const overflow = element.scrollWidth - element.clientWidth;
  const width = overflow > 0 ? element.scrollWidth + overflow : element.clientWidth;
  return { height, lines, width };
}

/** How many rows the writing sits on. One rect is not one row: an inline child — the plus on a
 * paid figure — reports a rect of its own beside the text's on the same row, and counting rects
 * made such a figure read three rows tall, so it was shrunk to the floor. */
function lineCount(rects: ArrayLike<DOMRect>): number {
  const rows = Array.from(rects).filter((rect) => rect.bottom > rect.top);
  rows.sort((left, right) => left.top - right.top);
  let lines = 0;
  let reach = -Infinity;
  for (const row of rows) {
    if (row.top >= reach) lines += 1;
    reach = Math.max(reach, row.bottom);
  }
  return lines;
}

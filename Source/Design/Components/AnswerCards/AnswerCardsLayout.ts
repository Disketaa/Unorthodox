export type AnswerCardsColumns = 1 | 2 | 3;

/** How many answers go across. The widest a bank of them is drawn, and a row of four short
 * panels is a strip rather than a board. */
const MaxColumns = 3;

/** The narrowest a card may be and still hold a sentence. Below this the board would rather have
 * fewer, larger cards, since the answers on them are read and not scanned. */
const MinCardWidth = 180;

/** How many answers go across. The room's own count first, so two answers sit side by side
 * rather than as one column with a gap beside it; then the width, which may refuse it and give
 * fewer, larger cards rather than unreadable ones. */
export function columnsFor(count: number, boardWidth: number): AnswerCardsColumns {
  const wanted = Math.min(MaxColumns, Math.max(1, count));
  // A board with no width yet has nothing to refuse the count, which is the first render and any
  // browser that will not measure. One column for an unmeasured board would be a board that laid
  // itself out once and never again, since the measurement is what moves it off that.
  if (boardWidth <= 0) {
    return asColumns(wanted);
  }
  return asColumns(Math.min(wanted, Math.max(1, Math.floor(boardWidth / MinCardWidth))));
}

/** A count as the union the board's classes are named from. Three cases rather than a cast. */
function asColumns(value: number): AnswerCardsColumns {
  if (value >= 3) return 3;
  if (value === 2) return 2;
  return 1;
}

/** The cells the last row is short by, drawn empty so a row of four answers on three columns
 * reads as two over one rather than with the last one hanging off the left. Counted from the
 * same column count the grid is cut for, which is why that count is decided in render. */
export function fillersFor(count: number, columns: AnswerCardsColumns): number {
  return (columns - (count % columns)) % columns;
}

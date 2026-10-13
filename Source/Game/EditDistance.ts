import { GameConfig } from './GameConfig';

/** How many edits two words may be apart and still be the same word, by the length of the shorter
 * one. A short word has no room to be wrong in: `нюх` and `дота` are one edit apart and are not
 * the same answer, so anything under the fuzzy floor has to match exactly. */
export function editsAllowed(length: number): number {
  const { noEdits, fuzzyMinLength, fuzzyMaxEdits, fuzzyLongMinLength, fuzzyLongMaxEdits } =
    GameConfig.grouping;
  if (length < fuzzyMinLength) {
    return noEdits;
  }
  return length < fuzzyLongMinLength ? fuzzyMaxEdits : fuzzyLongMaxEdits;
}

/** The optimal string alignment distance between two words: the edits it takes to turn one into
 * the other, where a transposed pair counts as one edit rather than two. The transposition is
 * there because `привте` is what a phone types, and it is the whole of the difference. */
export function editDistance(a: string, b: string): number {
  const width = a.length + 1;
  const matrix: number[][] = [];
  for (let row = 0; row <= b.length; row += 1) {
    matrix.push(new Array<number>(width).fill(row));
  }
  for (let column = 0; column < width; column += 1) {
    matrix[0][column] = column;
  }
  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column < width; column += 1) {
      const cost = a.charAt(column - 1) === b.charAt(row - 1) ? 0 : 1;
      let best = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
      // A transposed pair is one edit, and it is read off the cell two back on both axes — which
      // is why the whole matrix is kept rather than the two rows a plain Levenshtein needs.
      const transposed =
        row > 1 &&
        column > 1 &&
        a.charAt(column - 1) === b.charAt(row - 2) &&
        a.charAt(column - 2) === b.charAt(row - 1);
      if (transposed) {
        best = Math.min(best, matrix[row - 2][column - 2] + 1);
      }
      matrix[row][column] = best;
    }
  }
  return matrix[b.length][a.length];
}

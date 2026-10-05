/** Normalize an answer string for comparison: lowercased, 'ё' folded to 'е', punctuation to a
 * space, runs of spaces collapsed. The fold is deliberate, since plenty of keyboards lack 'ё',
 * and punctuation becomes a space so "а,б" splits rather than fusing to "аб". */
export function normalizeAnswer(input: string): string {
  let result = input.toLowerCase();
  result = result.replace(/ё/g, 'е');
  result = result.replace(/[^a-zа-я0-9]/g, ' ');
  result = result.replace(/\s+/g, ' ');
  return result.trim();
}
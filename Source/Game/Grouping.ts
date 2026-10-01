import { normalizeAnswer } from './Normalization';
import { PlayerId } from '@/Core';

// Typical Russian endings to strip. Order matters: the first match wins, so longer
// endings come first, otherwise 'ам' would be missed behind a trailing 'а'. Only words
// longer than four characters are stripped at all, which keeps a short stem intact.
const russianEndings = [
  'ам', 'ям', 'ом', 'ем', 'им', 'ым', // plural instrumental/dative/prepositional
  'а', 'я', 'ы', 'ь', 'й', 'у', 'ю', 'е', // common singular endings
  'и', // plural nominative
];

/**
 * Strip typical Russian endings from a word.
 * Returns the word with the longest matching ending removed, if any.
 * We only strip if the word length is greater than 4 to avoid stripping too short words.
 */
function stripRussianEndings(word: string): string {
  if (word.length <= 4) {
    return word;
  }
  for (const ending of russianEndings) {
    if (word.endsWith(ending)) {
      return word.slice(0, -ending.length);
    }
  }
  return word;
}

/**
 * Compute the Levenshtein distance between two strings.
 * Returns the number of single-character edits (insertions, deletions, substitutions) required to change one string into the other.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalize an answer for grouping purposes.
 * This includes the basic normalization plus stripping Russian endings from each word.
 */
export function normalizeForGrouping(answer: string): string {
  const normalized = normalizeAnswer(answer);
  const words = normalized.split(' ');
  const processedWords = words.map(word => stripRussianEndings(word));
  return processedWords.join(' ');
}

/**
 * Group answers based on similarity.
 * Two answers are in the same group if:
 *   - Their normalized-for-grouping strings are exactly equal, OR
 *   - Their Levenshtein distance is ≤1 and the length of the longer string is ≥5.
 * We use a simple greedy algorithm: iterate through answers and assign to the first matching group.
 */
export function groupAnswers(answers: string[]): { groupId: number; answers: string[] }[] {
  const groups: { groupId: number; answers: string[] }[] = [];
  const groupKeys: string[] = []; // the normalized-for-grouping string for each group (representative)

  for (const answer of answers) {
    const key = normalizeForGrouping(answer);
    let placed = false;

    for (let i = 0; i < groups.length; i++) {
      const groupKey = groupKeys[i];
      if (groupKey === key) {
        groups[i].answers.push(answer);
        placed = true;
        break;
      }
      if (key.length >= 5 && groupKey.length >= 5) {
        const dist = levenshteinDistance(groupKey, key);
        if (dist <= 1) {
          groups[i].answers.push(answer);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      const newGroupId = groups.length;
      groups.push({ groupId: newGroupId, answers: [answer] });
      groupKeys.push(key);
    }
  }

  return groups;
}

/**
 * Group answers with their player IDs based on similarity.
 * Two answers are in the same group if:
 *   - Their normalized-for-grouping strings are exactly equal, OR
 *   - Their Levenshtein distance is ≤1 and the length of the longer string is ≥5.
 * We return an array of groups, each containing the groupId, the list of answers, and the list of playerIds.
 */
export function groupAnswersWithPlayers(answers: Map<PlayerId, string>): {
  groupId: number;
  answers: string[];
  playerIds: PlayerId[];
}[] {
  const groups: { groupId: number; answers: string[]; playerIds: PlayerId[] }[] = [];
  const groupKeys: string[] = [];
  const keyToGroupIndex = new Map<string, number>();

  for (const [playerId, answer] of answers) {
    const key = normalizeForGrouping(answer);
    let groupIndex = keyToGroupIndex.get(key);
    if (groupIndex === undefined) {
      for (const [existingKey, existingIndex] of keyToGroupIndex) {
        if (
          key.length >= 5 &&
          existingKey.length >= 5 &&
          levenshteinDistance(key, existingKey) <= 1
        ) {
          groupIndex = existingIndex;
          break;
        }
      }
    }
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      groups.push({ groupId: groupIndex, answers: [], playerIds: [] });
      groupKeys.push(key);
      keyToGroupIndex.set(key, groupIndex);
    }
    const group = groups[groupIndex];
    group.answers.push(answer);
    group.playerIds.push(playerId);
  }

  return groups;
}
import { PlayerId } from '@/Core';
import { normalizeAnswer } from './Normalization';
import { answerWords } from './AnswerWords';
import { sameWords } from './WordMatch';
import { stripRussianEndings } from './WordForms';

/** Normalize an answer to the string form of it: the basic normalization plus Russian endings
 * stripped from each word. No longer the key the grouping compares — that is `answerWords`,
 * which also folds a Latin keyboard and glues a spaced-out word back together. */
export function normalizeForGrouping(answer: string): string {
  return normalizeAnswer(answer)
    .split(' ')
    .map((word) => stripRussianEndings(word))
    .join(' ');
}

/** Whether two answers are the same answer, by the rule the board groups them with. The host
 * decides who wrote a group and a browser decides which cards are its own, and if the two
 * disagree a player is offered a like on their own answer. */
export function sameAnswer(a: string, b: string): boolean {
  return sameWords(answerWords(a), answerWords(b));
}

/** Group answers on the rule the board shows them with. Greedy: each answer joins the first
 * group whose key it matches, and a group's key is its first member. Fuzzy matching is not
 * transitive, so a browser asking "is this mine" has to ask about that first answer. */
function cluster<T>(items: readonly T[], textOf: (item: T) => string): T[][] {
  const keys: string[][] = [];
  const groups: T[][] = [];
  for (const item of items) {
    const words = answerWords(textOf(item));
    const hit = keys.findIndex((key) => sameWords(key, words));
    if (hit === -1) {
      keys.push(words);
      groups.push([item]);
      continue;
    }
    groups[hit].push(item);
  }
  return groups;
}

export function groupAnswers(answers: string[]): { groupId: number; answers: string[] }[] {
  return cluster(answers, (answer) => answer).map((group, groupId) => ({
    groupId,
    answers: group,
  }));
}

/** The same grouping, carrying the player each answer came from. */
export function groupAnswersWithPlayers(answers: Map<PlayerId, string>): {
  groupId: number;
  answers: string[];
  playerIds: PlayerId[];
}[] {
  const entries = [...answers].map(([playerId, answer]) => ({ playerId, answer }));
  return cluster(entries, (entry) => entry.answer).map((group, groupId) => ({
    groupId,
    answers: group.map((entry) => entry.answer),
    playerIds: group.map((entry) => entry.playerId),
  }));
}

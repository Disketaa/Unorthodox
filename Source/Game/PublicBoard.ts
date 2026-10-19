import { randomFor, shuffle, PlayerId } from '@/Core';
import { marksForRoom } from './PublicMarks';
import { declinedGroupIds, toCardScore } from './RoundScoring';
import { scoreSteps } from './Scoring';
import type { BoardState } from './GameState';
import { GameConfig } from './GameConfig';
import { groupAnswersWithPlayers } from './Grouping';
import type { PublicReviewingState, PublicScoreGroup, PublicRoom } from './PublicState';

/** The board's cards: the answers as written, in an order nobody can read off who wrote what,
 * plus one card between all the players who wrote nothing. Seeded from the round and not the
 * clock, since letting a held room go shifts the clock. */
function reviewGroups(state: BoardState): PublicScoreGroup[] {
  const written = [...state.answers.values()];
  const answers = groupAnswersWithPlayers(state.answers).map((group) => ({
    groupId: group.groupId,
    text: group.answers[0] ?? '',
    playerCount: group.answers.length,
    playerIds: group.playerIds,
    isEmpty: false,
  }));
  const groups = shuffle(answers, randomFor(`${state.topic}:${written.join('|')}`));
  // Everybody who wrote nothing is one card between them, the way everybody who wrote the same
  // thing is. One blank each was a board with more cards than there were people to put in it. The
  // card still says how many, so the room still learns how many sat the round out.
  const blanked = [...state.players.keys()].filter((playerId) => !state.answers.has(playerId));
  if (blanked.length > 0) {
    groups.push({
      groupId: groups.length,
      text: '',
      playerCount: blanked.length,
      playerIds: blanked,
      isEmpty: true,
    });
  }
  return groups;
}

/** Everything a screen draws the board out of: the cards, the room's marks on them, and the
 * round total per player. Both halves of a round send the same board, since both draw the same
 * screen, and building it once here is what keeps the two from drifting apart. */
export function boardOf(
  state: BoardState,
  includeScore?: boolean
): {
  groups: PublicScoreGroup[];
  likeCounts?: PublicReviewingState['likeCounts'];
  mutedGroupIds?: PublicReviewingState['mutedGroupIds'];
  affectedPlayerIds?: PublicRoom['affectedPlayerIds'];
} {
  const groups = reviewGroups(state);
  const marks = marksForRoom(state, declinedGroupIds(state));
  if (includeScore !== true) {
    return { groups, ...marks };
  }
  return {
    groups: groups.map((group) => {
      const card = toCardScore(state, {
        playerIds: group.playerIds,
        groupId: group.groupId,
        isEmpty: group.isEmpty,
      });
      // Always sent, zero included: a card the room struck out pays nothing, and the room is being
      // told what it paid. A dropped zero left a denied card showing its answer for the rest of
      // the round, which reads as "not counted yet" rather than as the score it is.
      return { ...group, score: scoreSteps(card, GameConfig) };
    }),
    ...marks,
  };
}

/** What every seat stood at before this round began, as pairs rather than a map. Deliberately
 * not the round added in: the room is reading the answers, and paying them before that is
 * showing the verdict before what it was paid for. */
export function totalsForReview(state: BoardState): { id: PlayerId; score: number }[] {
  const totals: { id: PlayerId; score: number }[] = [];
  state.cumulativeScores.forEach((score, id) => totals.push({ id, score }));
  return totals;
}

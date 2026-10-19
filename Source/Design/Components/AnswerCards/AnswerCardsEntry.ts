import type { PlayerId } from '@/Core';
import type { AnswerAuthor } from '../AnswerCard';

/** One answer the room is being shown, as the bank draws it. Its own shape rather than the
 * review screen's, since the bank is a design component and knows nothing about a phase. */
export interface AnswerCardsEntry {
  id: number;
  text: string;
  /** How many players wrote this answer. */
  count: number;
  /** Whether this player has already voted against it. */
  voted: boolean;
  /** Whether this is the card of a player who wrote nothing. Drawn like any other answer and not
   * votable, since there is no answer on it to vote out. */
  blank?: boolean;
  /** How many liked this answer, as the room counted it. Drawn on every card including a blank,
   * since a player who sat a round out is still shown what the room thought of their seat. */
  likes?: number;
  /** Whether this player is one of the people who liked it. */
  liked?: boolean;
  /** Whether this player wrote it, and so may not like their own answer. The badge is drawn
   * either way: they are shown the count, and only the press is taken away. */
  own?: boolean;
  /** What this card's like badge says out loud, already in the room's language. Per card because
   * it quotes the count, and the count differs from card to card. */
  likeLabel: string;
  /** Who wrote this answer, drawn as faces in the card's corner once the room has had a moment
   * with the sentence. */
  authors?: readonly AnswerAuthor[];
  /** When each of those writers lands, in the order they are drawn. */
  writerDelays?: readonly number[];
  /** Whether the room has been told who wrote this answer yet. Off for the first stretch of the
   * card's beat, so an answer lands on its own before the room learns who agreed with it. */
  authorsShown?: boolean;
  /** How many of the writers have landed in the corner. The figure behind the answer counts up
   * as it rises, and a shared answer is struck out on the second face rather than on the
   * round's own decision, which the room was told about a beat before it could see it. */
  landed?: number;
  /** Whether the room is yet offered a like on this card. A badge arriving on the same frame as
   * the thing it is about is a control rather than an invitation, so it waits a beat. */
  revealed?: boolean;
  /** Which of the writers is this player, so their own chip is marked the way the bar at the top
   * of the game marks it. Left out, no chip is the local player's. */
  ownPlayerId?: PlayerId | null;
  /** What this card paid, broken into the steps the count-up animates through. Left out until
   * the count reaches this card: before its turn it is an answer being read, and a figure on it
   * would be one for something the room has not been told yet. */
  score?: {
    base: number;
    mult: number;
    likes: number;
    total: number;
  };
  /** Whether this card is the one being paid right now, and so is painted in its writer's colour
   * and is the only card on the board still at full ink. */
  paying?: boolean;
  /** Whether the count has gone past this card, which is what holds it back once it is paid. */
  paid?: boolean;
  /** Whether the round's enchanted card reached any of the writers of this answer. Carried on
   * the card rather than worked out where it is drawn, since only the round's own state knows
   * who the enchantment reached. */
  enchanted?: boolean;
}

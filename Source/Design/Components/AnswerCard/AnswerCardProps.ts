import { CharacterColor, CharacterId, PlayerId } from '@/Core';

/** One of the players an answer was written by, as the card draws them: the same face and the
 * same name the roster chip at the top of the screen is made of. Handed over whole rather than
 * as an id, since a card has no roster of its own to look anybody up in. */
export interface AnswerAuthor {
  id: PlayerId;
  name: string;
  color: CharacterColor;
  character: CharacterId;
}

export interface AnswerCardProps {
  /** The answer, as everybody who wrote this wrote it. */
  text: string;
  /** How many players wrote it. Drawn behind the answer as the card's own figure: one for a card
   * nobody shared, since that is decoration and not news, and counting up as the writers land
   * for a shared one, so the figure and the corner are always the same claim. */
  count: number;
  /** Whether the host has muted this answer, which the whole room is shown. */
  voted?: boolean;
  /** Whether the player wrote nothing, so this card stands for a round they sat out. */
  blank?: boolean;
  /** Muting the answer and taking the mute back. Only the host is given one. */
  onReject?: () => void;
  /** How many liked this answer, as the room counted it. */
  likes?: number;
  /** Whether this player is one of the people who liked it. */
  liked?: boolean;
  /** What the like badge says out loud, in the room's own language. */
  likeLabel?: string;
  /** Liking the answer and taking the like back. Left out on the player's own answer and on a
   * blank, being a record rather than an answer: a badge drawn but not pressable is a figure. */
  onLike?: () => void;
  /** What the mute says out loud. One name for both states, since `aria-pressed` is what says
   * which one it is in — the same name in both would read as one control that is on or off. */
  muteLabel?: string;
  /** Whether the room has got to this answer yet. A board already drawn is a board nobody
   * watched being wrong about. On by default, which is every use but the round's own. */
  turned?: boolean;
  /** Whether this player wrote it: the one card on the board they already know the answer to,
   * and the only one that can afford to be coloured. Not the same as being the only writer — a
   * card other players shared is still theirs, and it is declined rather than merely unshared. */
  own?: boolean;
  /** Who wrote it, drawn as the roster's own chips in the corner. */
  authors?: readonly AnswerAuthor[];
  /** When each of those writers lands, in milliseconds from the room being told, one entry per
   * author and in their order. Passed in because the beat belongs to the round and `Design`
   * does not know what the round is; left out, every seat comes up with the card at once. */
  writerDelays?: readonly number[];
  /** Which of them is this player, so their own chip is marked the way the bar at the top of the
   * game marks it. Left out, no chip is the local player's. */
  ownPlayerId?: PlayerId | null;
  /** Whether the room has been told who wrote it yet, a beat after the card comes up so the
   * sentence lands before the room finds out who agreed with it. */
  authorsShown?: boolean;
  /** How many of the writers have landed in the corner, counted by whoever is running the
   * reveal, so this card and the bar land them on the same frame. A number rather than worked
   * out here, since a card drawn as a record has nobody counting for it. */
  landed?: number;
  /** Whether this card has finished saying everything it has to say. Nothing is offered for a
   * press before this — not the like and not the mute, both being opinions about an answer the
   * room has not finished reading. One flag for both, so they cannot disagree. */
  revealed?: boolean;
  /** Whether this card idles. Off for a gallery row or anything already moving. */
  moving?: boolean;
  /** Whether this card has been taken off the board and may not be put back, being a thing more
   * than one player wrote. Drawn with the cursor that says so, the only way a card that was a
   * control a moment ago can say it has stopped being one. */
  locked?: boolean;
  /** What this card paid out, broken into the steps the count-up animates through. Only once the
   * count has reached this card: before its turn the card is still an answer the room is
   * reading, and a figure on it would be for something not yet told. */
  score?: {
    base: number;
    mult: number;
    likes: number;
    total: number;
  };
  /** Whether the count has passed this card, which is what holds it back to the quietness every
   * paid card is drawn at. A muted card included: the round being paid is a fact about the
   * card, not a second thing that only the cards nobody struck out are told. */
  paid?: boolean;
  /** Whether this card is the one being paid right now, and so is painted in its writer's colour
   * and is the only card on the board still at full ink. */
  paying?: boolean;
  /** Whether the round's enchanted card reached one of this card's writers, and so the figure on
   * it is partly the enchantment's doing. The count adds a "mult" but nothing on the card says
   * why the room was given one; this is the reason, and what the shine is for. */
  enchanted?: boolean;
  /** Whether the round is counting at all, rather than still being read. It hands the like badge
   * the card's own colour on every card, even ones the count has not reached: voting is over,
   * so the reader's accent is no longer what that badge says anything about. */
  counting?: boolean;
  /** Whether the room is held, which stands the count where it is rather than letting it run on
   * under a held room. Left out, the count runs, which is every use outside a live game. */
  paused?: boolean;
  /** Which run of the phase the room is on. A run number rather than the phase's start, because
   * a held room's start moves on by however long it was held and anything keyed on it takes a
   * pause for a restart. */
  run?: number;
  /** How far into this card's own count the room is, off the phase clock, which is what says
   * which figure of the count the card is showing. */
  elapsedMs?: number;
}

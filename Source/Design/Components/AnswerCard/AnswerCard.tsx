import { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { writerDelayMs } from '@/Game';
import { Pop } from '@/Design/Primitives';
import { useFittedText } from './UseFittedText';
import { playSound } from '../../Sounds';
import { LikeBadge, LikePitchSemitones } from '../LikeBadge';
import { PlayerBar } from '../PlayerBar';
import styles from './AnswerCard.module.css';

/** One of the players an answer was written by, as the card draws them: the same face and the
 * same name the roster chip at the top of the screen is made of. Handed over whole rather than as
 * an id, since a card has no roster of its own to look anybody up in. */
export interface AnswerAuthor {
  id: PlayerId;
  name: string;
  character: CharacterId;
  color: CharacterColor;
}

/** How many writers a card names at the roomiest, before the seats start giving up their size.
 * A card is not wide enough for a room, and the room has to be able to read the answer on it. */
const RoomyAuthors = 4;

/** How many writers before the seats are at their smallest. Past here every seat is a face and
 * nothing more, which is still a face per player rather than a figure nobody can find. */
const CrowdedAuthors = 8;

/** How roomy the writers are drawn, from how many of them there are: the more there are, the
 * smaller each seat and the less air between them, so a card ten people wrote still names ten
 * people rather than running out of corner and counting the rest. */
function authorsClass(count: number): string {
  if (count >= CrowdedAuthors) return styles.AuthorsTight;
  if (count > RoomyAuthors) return styles.AuthorsCrowd;
  return '';
}

export interface AnswerCardProps {
  /** The answer, as everybody who wrote this wrote it. */
  text: string;
  /** How many players wrote it. Drawn behind the answer as the card's own figure: a figure of one
   * for a card nobody shared, since that is decoration and not news, and for a card several people
   * wrote it counts up as the writers land, so the figure and the faces in the corner are always
   * the same claim and the card never says more than it has shown. */
  count: number;
  /** Whether the host has muted this answer, which the whole room is shown. */
  voted?: boolean;
  /** Whether the player wrote nothing at all, so this card stands for a round they sat out. Held
   * back to the same quietness as a theme card with no rounds left in it. */
  blank?: boolean;
  /** Muting the answer, and taking the mute back. Only the host is given one, so on every other
   * screen the card is a record of the round rather than a control in it. */
  onReject?: () => void;
  /** How many liked this answer, as the room counted it. */
  likes?: number;
  /** Whether this player is one of the people who liked it. */
  liked?: boolean;
  /** What the like badge says out loud, in the room's own language. */
  likeLabel?: string;
  /** Liking the answer, and taking the like back. Left out on the player's own answer and on a
   * blank, being a record rather than an answer: a badge drawn but not pressable is a figure. */
  onLike?: () => void;
  /** What the mute says out loud. One name for both states, since `aria-pressed` is what says
   * which one it is in — the same name in both would read as one control that is on or off. */
  muteLabel?: string;
  /** Whether the room has got to this answer yet. A card the room has not read is not on the
   * board: the room is shown one answer at a time, and a board already drawn is a board nobody
   * watched being wrong about. On by default, which is every use but the round's own. */
  turned?: boolean;
  /** Who wrote it, drawn as the roster's own chips in the corner. */
  authors?: readonly AnswerAuthor[];
  /** Which of them is this player, so their own chip is marked the way the bar at the top of the
   * game marks it. Left out, no chip is the local player's. */
  ownPlayerId?: PlayerId | null;
  /** Whether the room has been told who wrote it yet, which is a beat after the card comes up so
   * the sentence lands before the room finds out who agreed with it. On by default, which is
   * every use but the round's own. */
  authorsShown?: boolean;
  /** How many of the writers have landed in the corner, counted by whoever is running the reveal,
   * so that this card and the bar at the top of the screen land them on the same frame. Taken as
   * a number rather than worked out here for the reason on the property below. */
  landed?: number;
  /** Whether this card has finished saying everything it has to say: the answer written out and
   * every writer of it named. Nothing is offered for a press before this — a like is a reaction
   * to what somebody said, and not to half of it. On by default, which is every screen but the
   * round's own, since a board being shown after the fact has nothing left to reveal. */
  revealed?: boolean;
  /** Whether this card has been taken off the board and may not be put back, being a thing more
   * than one player wrote. Drawn with the cursor that says so, which is the only way a card that
   * was a control a moment ago can say it has stopped being one. */
  locked?: boolean;
}

/** The classes a card is drawn as, so the one place that answers "what state is it in" is one
 * expression rather than one branch per state at every use. */
function cardClasses(
  voted: boolean,
  blank: boolean,
  turned: boolean,
  locked: boolean,
  live: boolean
): string {
  const classes = [styles.Root];
  if (voted) classes.push(styles.Voted);
  if (blank) classes.push(styles.Blank);
  // The card is either something to press or a record, and which of those two is decided by
  // whether it is in the round rather than by whether this browser has a control for it: a host's
  // card is live the moment it comes up, and so is anybody else's, and the difference between them
  // is which control is lying on top rather than whether there is one.
  classes.push(live ? styles.Live : styles.Record);
  if (locked) classes.push(styles.Locked);
  if (!turned) classes.push(styles.Unturned);
  return classes.join(' ');
}

/** What is written on the card: the answer, fitted to the box it is given, and the figure behind
 * it. The panel and the grain are decoration on a surface the card paints itself, so they are
 * spans rather than layout elements: a `Card` here would fight the button's own box.
 *
 * A card one player wrote says one, and always has. It is the common case on a board of them and
 * the figure is decoration there rather than news, so there is nothing to hold it back for.
 *
 * A card several players wrote counts up as the writers land, one figure for every face in the
 * corner — so the number and the faces are always the same claim, and the room is never told more
 * than it has been shown. Nothing at all is drawn until the first face lands: a card that says
 * two the moment it comes up gave the answer away before the round had its beat. */
function Face({
  text,
  count,
  named,
}: {
  text: string;
  count: number;
  named: number;
}): ComponentChildren {
  const shared = count > 1;
  const shown = shared ? Math.min(count, named) : count;
  const held = shared && named === 0;
  return (
    <>
      <span class={styles.Panel} aria-hidden="true" />
      {!held && shown >= 1 && (
        <span class={styles.Mark} aria-hidden="true">
          {shown}
        </span>
      )}
      <span class={styles.Noise} aria-hidden="true" />
      <FittedAnswer text={text} />
    </>
  );
}

/** The answer itself, which measures itself into the card rather than being cut off at its edge.
 * Its own element inside the centring room rather than text straight into it: as bare text it
 * is sized to its longest line, and a word wider than the card then cannot wrap. */
function FittedAnswer({ text }: { text: string }) {
  const answer = useRef<HTMLSpanElement>(null);
  useFittedText(answer, text);
  return (
    <span class={styles.Room}>
      <span class={styles.Answer} ref={answer}>
        {text}
      </span>
    </span>
  );
}

/** The like badge in the corner, or nothing at all on a blank or a card the host has muted. A
 * blank is nobody having written and a muted card is out of the round, so neither has anything
 * a like could be. */
function LikeCorner({
  blank,
  voted,
  revealed,
  likes,
  liked,
  likeLabel,
  onLike,
}: Pick<
  AnswerCardProps,
  'blank' | 'voted' | 'revealed' | 'likes' | 'liked' | 'likeLabel' | 'onLike'
>) {
  // A press counter rather than the liked flag, so the pop runs on the press and not on the state
  // arriving: the flag only flips once the host has answered, a beat after the finger.
  const [pressed, setPressed] = useState(0);
  // Not until the card has finished saying everything it has to say. A like offered over an
  // answer still being written at is a like on half a sentence, and one offered while the corner is
  // still filling with faces is a like on a card that is about to be struck out of the round.
  if (blank || voted || !revealed) {
    return null;
  }
  // The corner rather than the badge is held back, so the figure, the mark and the outline round
  // it all fade as one thing. Only the cursor lives on the badge, which has to say it in place.
  const spent = onLike === undefined;
  return (
    <span class={spent ? `${styles.Corner} ${styles.CornerSpent}` : styles.Corner}>
      {/* Keyed on the count of presses, so a new one is a new element and the pop runs from
       * the start. Composed rather than written: the sway underneath is also a CSS animation,
       * and the pop uses individual scale and rotate so the two do not overwrite one another. */}
      <Pop trigger={pressed}>
        <LikeBadge
          count={likes ?? 0}
          liked={liked ?? false}
          label={likeLabel ?? ''}
          onToggle={
            onLike === undefined
              ? undefined
              : () => {
                  setPressed((count) => count + 1);
                  onLike();
                }
          }
        />
      </Pop>
    </span>
  );
}

/** Fires when a badge lands, so the room hears each one come up rather than the wave as a whole.
 * The first badge is silent: it comes up with the card, which already has its own sound. */
function onBadgeLand() {
  playSound('Pop');
}

/** Who wrote this answer, in the corner, once the room has had its moment with the sentence
 * itself: one seat per writer, each landing on its own beat. Drawn on a blank card too, and there
 * it is the whole point of the card: a seat nobody wrote for is the one the room is shown.
 *
 * Every seat reports the frame it lands on, which is what puts the card's figure behind the answer
 * up to the count of the faces actually in the corner. It is the same event either way rather than
 * a second timer beside it: a number counting up to writers that arrive on a schedule of their
 * own is a number the room can catch out. */
function Authors({
  authors,
  shown,
  ownPlayerId,
}: {
  authors: readonly AnswerAuthor[] | undefined;
  shown: boolean;
  ownPlayerId: PlayerId | null | undefined;
}) {
  const all = authors ?? [];
  if (!shown || all.length === 0) {
    return null;
  }
  return (
    <div class={`${styles.Authors} ${authorsClass(all.length)}`}>
      {/* Right to left, and the row hugs the right edge: the first writer is the one on the right,
       * next to the badge, and the rest fill in leftward. The delay follows the place from the
       * right — the rightmost badge comes up with the card, and the leftmost is last. */}
      {all.map((author, index) => (
        <Pop
          key={author.id}
          trigger={author.id}
          delay={`${writerDelayMs(index)}ms`}
          squash="0"
          // Each badge lands on its own beat, and the room hears it land: a sound per badge, not one
          // at the end of the wave, which is what the mute's own pop already does. The first badge
          // is silent - it comes up with the card, which already has its own sound.
          onStart={index === 0 ? undefined : onBadgeLand}
        >
          <PlayerBar
            inline
            players={[
              {
                id: author.id,
                name: author.name,
                score: 0,
                character: author.character,
                color: author.color,
              },
            ]}
            ownPlayerId={ownPlayerId}
          />
        </Pop>
      ))}
    </div>
  );
}

/** One answer on a panel: the answer as the substance, how many wrote it behind it, and the
 * grain the theme cards are printed on. A div rather than a button, since it now carries two
 * controls and a button inside a button is not one. */
export function AnswerCard({
  text,
  count,
  voted = false,
  blank = false,
  turned = true,
  authors,
  authorsShown = true,
  landed = 0,
  revealed = true,
  locked = false,
  ownPlayerId,
  likes,
  liked,
  likeLabel,
  muteLabel,
  onReject,
  onLike,
}: AnswerCardProps) {
  // How many of the writers have landed in the corner, as the board counts them rather than
  // counting them here. Two things move on this number at once and neither is on the card alone:
  // the figure behind the answer counts up as it rises, and the bar at the top of the screen takes
  // these players off one seat at a time. A card keeping its own tally would leave the bar either
  // a beat behind the corner or a beat ahead of it, and a seat going off while its owner's face is
  // still arriving reads as the bar disagreeing with the board.
  //
  // Left to the writers rather than to the card: a card drawn as a record, on any screen but the
  // round's own, has nobody counting for it and would sit at one face forever.
  const named = Math.min(landed, count);
  const declined = voted && (count < 2 || named > 1);
  // A card is live from the frame it comes up, not from the frame its corner is finished. The
  // room is already looking at it, and a card that has nothing to say for a second and a half and
  // then starts saying it is a card whose cursor is lying to it for a second and a half.
  const live = turned && !blank && !declined;
  // A card only ever crosses over one way or the other, and never both, which is what lets each
  // moment keep its own sound without either doubling. A card one player wrote is struck by the
  // host pressing it, and the press sounds it. A card several wrote is struck by the round, with
  // no press anywhere near it, and lands its sound here when the second face does.
  const wasDeclined = useRef(declined);
  // Set by the press, spent by the effect. Whoever pressed has already heard the card go off, so
  // the effect stands down for them; everyone else was told by the board rather than by their own
  // finger, and the effect is what they hear. Without this the sound belongs to the host alone,
  // which is the one room of players who were all meant to be there.
  const pressedIt = useRef(false);
  useEffect(() => {
    if (wasDeclined.current === declined) return;
    wasDeclined.current = declined;
    if (pressedIt.current) {
      pressedIt.current = false;
      return;
    }
    playSound(declined ? 'Break' : 'Pop');
  }, [declined]);
  const classes = cardClasses(declined, blank, turned, locked && declined, live);
  return (
    <div class={classes}>
      <Face text={text} count={count} named={named} />
      {onReject !== undefined && (
        <button
          type="button"
          class={styles.Whole}
          aria-pressed={declined}
          aria-label={muteLabel}
          onClick={() => {
            // With the finger going down, not with the board having caught up: the sound belongs to
            // the press. Struck on the way in, the ordinary pop on the way back out. The effect
            // stands down for this press and lets the rest of the room hear it off the board.
            pressedIt.current = true;
            playSound(declined ? 'Pop' : 'Break');
            onReject();
          }}
        />
      )}
      {/* Everybody else likes with the card itself: a control the size of a card is the one thing
        that can be pressed in a room where people are standing up. Pointer only — the badge stays
        the labelled control, and a second tab stop for one action is one more than a card needs.
        Gone with the badge the moment the card is drawn as declined, since a card that took the
        press and did nothing would be the one control in the room with nothing behind it. */}
      {onReject === undefined && onLike !== undefined && live && (
        <button
          type="button"
          class={styles.Whole}
          aria-label={likeLabel}
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => {
            playSound('Pling', LikePitchSemitones);
            onLike();
          }}
        />
      )}
      <Authors authors={authors} shown={authorsShown} ownPlayerId={ownPlayerId} />
      <LikeCorner
        blank={blank}
        voted={declined}
        revealed={revealed}
        likes={likes}
        liked={liked}
        likeLabel={likeLabel}
        onLike={onLike}
      />
    </div>
  );
}

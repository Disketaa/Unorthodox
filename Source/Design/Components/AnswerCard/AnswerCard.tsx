import { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CharacterColor, CharacterId, PlayerId, createLogger } from '@/Core';
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

/** How long the room waits between the first writer of an answer and the second. Long on purpose:
 * two people writing the same thing is the moment the round is about, and the beat before the
 * second face lands is what makes it one rather than a fact. */
const SecondWriterBeat = '700ms';

/** How long each writer after the second takes. The same short beat for the third and the tenth,
 * since a room should not sit through eight pauses to be told the same thing again. */
const FurtherWriterBeat = '110ms';

/** When one writer's chip lands, as a finished length from the moment the room is told who wrote
 * this. The first is immediate, the second waits the dramatic beat, and every one after it takes a
 * short one — so a card ten people wrote still finishes inside a couple of seconds. */
function writerDelay(index: number): string | undefined {
  if (index <= 0) return undefined;
  if (index === 1) return SecondWriterBeat;
  return `calc(${SecondWriterBeat} + ${index - 1} * ${FurtherWriterBeat})`;
}

/** How roomy the writers are drawn, from how many of them there are: the more there are, the
 * smaller each seat and the less air between them, so a card ten people wrote still names ten
 * people rather than running out of corner and counting the rest. */
function authorsClass(count: number): string {
  if (count >= CrowdedAuthors) return styles.AuthorsTight;
  if (count > RoomyAuthors) return styles.AuthorsCrowd;
  return '';
}

const log = createLogger('AnswerCard');

export interface AnswerCardProps {
  /** The answer, as everybody who wrote this wrote it. */
  text: string;
  /** How many players wrote it. Drawn behind the answer as the card's own figure, and left off
   * entirely when it is one, since a single writer is the common case and a figure of one
   * behind every unique answer is a number that says nothing. */
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
}

/** The classes a card is drawn as, so the one place that answers "what state is it in" is one
 * expression rather than one branch per state at every use. */
function cardClasses(
  voted: boolean,
  votable: boolean,
  blank: boolean,
  turned: boolean
): string {
  const classes = [styles.Root];
  if (voted) classes.push(styles.Voted);
  if (blank) classes.push(styles.Blank);
  if (!votable) classes.push(styles.Record);
  if (!turned) classes.push(styles.Unturned);
  return classes.join(' ');
}

/** What is written on the card: the answer, fitted to the box it is given. The panel and the
 * grain are decoration on a surface the card paints itself, so they are spans rather than
 * layout elements: a `Card` here would fight the button's own box. */
function Face({ text, count }: Pick<AnswerCardProps, 'text' | 'count'>): ComponentChildren {
  return (
    <>
      <span class={styles.Panel} aria-hidden="true" />
      {count > 1 && (
        <span class={styles.Mark} aria-hidden="true">
          {count}
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
  likes,
  liked,
  likeLabel,
  onLike,
}: Pick<AnswerCardProps, 'blank' | 'voted' | 'likes' | 'liked' | 'likeLabel' | 'onLike'>) {
  // A press counter rather than the liked flag, so the pop runs on the press and not on the state
  // arriving: the flag only flips once the host has answered, a beat after the finger.
  const [pressed, setPressed] = useState(0);
  if (blank || voted) {
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

/** Who wrote this answer, in the corner, once the room has had its moment with the sentence
 * itself: one seat per writer, each landing on its own beat. Drawn on a blank card too, and there
 * it is the whole point of the card: a seat nobody wrote for is the one the room is shown. */
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
  // Temporary: what the card was handed and what it decided, so a missing face can be told apart
  // from a face that was never offered.
  useEffect(() => {
    log('info', `authors=${all.length} shown=${shown}`);
  }, [all.length, shown]);
  if (!shown || all.length === 0) {
    return null;
  }
  return (
    <div class={`${styles.Authors} ${authorsClass(all.length)}`}>
      {all.map((author, index) => (
        <Pop key={author.id} trigger={author.id} delay={writerDelay(index)}>
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
  ownPlayerId,
  likes,
  liked,
  likeLabel,
  muteLabel,
  onReject,
  onLike,
}: AnswerCardProps) {
  const classes = cardClasses(voted, onReject !== undefined, blank, turned);
  return (
    <div class={classes}>
      <Face text={text} count={count} />
      {onReject !== undefined && (
        <button
          type="button"
          class={styles.Whole}
          aria-pressed={voted}
          aria-label={muteLabel}
          onClick={() => {
            playSound('Pop');
            onReject();
          }}
        />
      )}
      {/* Everybody else likes with the card itself: a control the size of a card is the one thing
        that can be pressed in a room where people are standing up. Pointer only — the badge stays
        the labelled control, and a second tab stop for one action is one more than a card needs. */}
      {onReject === undefined && onLike !== undefined && (
        <button
          type="button"
          class={styles.Whole}
          aria-label={likeLabel}
          aria-hidden="true"
          tabindex="-1"
          onClick={() => {
            playSound('Pling', LikePitchSemitones);
            onLike();
          }}
        />
      )}
      <Authors
        authors={authors}
        shown={authorsShown}
        ownPlayerId={ownPlayerId}
      />
      <LikeCorner
        blank={blank}
        voted={voted}
        likes={likes}
        liked={liked}
        likeLabel={likeLabel}
        onLike={onLike}
      />
    </div>
  );
}

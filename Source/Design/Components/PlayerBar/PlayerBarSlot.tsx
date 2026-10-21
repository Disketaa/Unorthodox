import { useEffect, useRef } from 'preact/hooks';
import { Character } from '../Character';
import { Pop } from '@/Design/Primitives';
import { useFittedText } from '../AnswerCard/UseFittedText';
import characterStyles from '../Character/Character.module.css';
import { useGlintVariant } from '../Glint';
import type { PlayerBarEntry } from './PlayerBar';
import { useCountUp } from './UseCountUp';
import styles from './PlayerBar.module.css';

export interface PlayerBarSlotProps {
  entry: PlayerBarEntry;
  /** Its place in the row, so a row of arrivals ripples rather than popping at once. */
  index: number;
  isSelf: boolean;
}

/** The seat's classes: its own tint, and the marks for what the room is waiting on it for. */
function seatClasses(entry: PlayerBarEntry, isSelf: boolean, atWork: boolean): string {
  const offline = entry.isOnline === false;
  // The round gave this player nothing, so their hexagon is the shattered one. A seat the round
  // scored nothing is still a seat in the room, which is why it is broken rather than taken away.
  const scoredNothing = entry.scoredNothing === true;
  // The seat wears the player's own tint, the same class the character inside it wears. The seat
  // cannot read that off the character, since a custom property set on it stays down there.
  return [
    styles.Seat,
    characterStyles[entry.color],
    isSelf ? styles.Self : '',
    atWork ? styles.Waiting : '',
    offline ? styles.Offline : '',
    scoredNothing ? styles.Destroyed : '',
    entry.glinted ? styles.Glinted : '',
  ]
    .filter(Boolean)
    .join(' ');
}

interface FaceProps {
  entry: PlayerBarEntry;
  index: number;
  atWork: boolean;
  shown: { value: number; added: boolean } | undefined;
  trigger: string;
}

/** The hexagon's own content: the figure the round paid, the mark of a seat the room waits on or
 * one the round broke, or the player's own character underneath. */
function Face({ entry, index, atWork, shown, trigger }: FaceProps) {
  // The round gave this player nothing, so their seat is broken and the face is not coming back.
  // The cross stands where the character was: the shattered hexagon says the seat is broken, and
  // the cross says what happened to the player on it — the one thing the seat cannot say.
  const broken = entry.scoredNothing === true;
  return (
    <span class={styles.Face}>
      {shown !== undefined ? (
        // Keyed on the figure itself, so a seat moving from this card's points to what the
        // player has altogether pops on the change rather than on the count that caused it.
        <Pop trigger={trigger}>
          <Payout value={shown.value} added={shown.added === true} failed={broken} />
        </Pop>
      ) : broken ? (
        <span class={styles.Killed} aria-hidden="true" />
      ) : atWork ? (
        <span class={styles.Turning} aria-hidden="true" />
      ) : (
        <Character
          character={entry.character}
          color={entry.color}
          size="Fill"
          pulse={entry.pulse}
          index={index}
        />
      )}
    </span>
  );
}

/** The figure a paid seat stands for, shrunk into the hexagon rather than cut off by it: the
 * same measure-it fit an answer on a card uses, against its own scale. Written at a fixed size,
 * a two-digit standing spills out of a seat on a phone and is a postage stamp on a projector. */
function Payout({ value, added, failed }: { value: number; added: boolean; failed: boolean }) {
  const figure = useRef<HTMLSpanElement>(null);
  useFittedText(figure, String(value), '--PlayerBar-Payout-Fit');
  return (
    <span class={styles.PayoutRoom}>
      <span
        class={failed ? `${styles.Payout} ${styles.PayoutFailed}` : styles.Payout}
        ref={figure}
      >
        {added && <span class={styles.Added}>+</span>}
        {value}
      </span>
    </span>
  );
}

/** The shine a seat wears for the round: the one the enchantment laid over it, which is there
 * for as long as the round is. */
function SeatShine({ entry, glintClass }: { entry: PlayerBarEntry; glintClass: string }) {
  return <>{entry.glinted && <span class={glintClass} aria-hidden="true" />}</>;
}

/** One player in the bar: their name over a hexagon, and their score over it instead while the
 * pointer is on the seat. The name is what a player looks for in a room they have just joined,
 * where a face alone asks them to remember who they picked. */
export function PlayerBarSlot({ entry, index, isSelf }: PlayerBarSlotProps) {
  // At work, whichever way the room is waiting on them: holding the turn, writing an answer nobody
  // has read yet, or having their card counted. One mark for all three, so it reads the same
  // whoever it is the room waits on — the bar need only say that this is a seat it waits on.
  const atWork =
    entry.isTurning === true || entry.isWorking === true || entry.isPaying === true;
  // The round has paid this seat, which now stands for the figure rather than the face, in the
  // face's own place: a figure pinned beside a face would be a badge on a person rather than the
  // person having become the number. A seat paid nothing stands for its standing, in error colour.
  const payout = entry.payout;
  // What the figure says about itself: an addition is what the card being counted is paying, and
  // everything after it is the player's standing. The same digits, marked differently, so the room
  // is not shown a number changing places with another number when nothing about the player did.
  const figure = payout === undefined ? undefined : `${payout.added ? '+' : ''}${payout.value}`;
  // Primitives copied out of payout so the animation effects can key off stable values rather
  // than a new object identity every render.
  const payoutValue = payout?.value ?? 0;
  const counting = useCountUp(payout, payoutValue);
  // The trigger Pop restarts on must not change while the counter is climbing, or the pop
  // animation restarts every frame and the seat strobes. Only change it when the logical figure
  // actually changes.
  const popTriggerRef = useRef(figure ?? '');
  useEffect(() => {
    const next = figure ?? '';
    if (next !== popTriggerRef.current) {
      popTriggerRef.current = next;
    }
  }, [figure]);

  const shown = counting !== undefined ? { value: counting, added: false } : payout;
  const variant = useGlintVariant();
  const glintClass = `${styles.Glint} ${styles[`Glint${variant}`]}`;

  return (
    <div class={seatClasses(entry, isSelf, atWork)}>
      <span class={styles.Slot}>
        <Face
          entry={entry}
          index={index}
          atWork={atWork}
          shown={shown}
          trigger={popTriggerRef.current}
        />
        <SeatShine entry={entry} glintClass={glintClass} />
      </span>
      <span class={styles.Label}>
        <span class={styles.Name}>{entry.name}</span>
        <span class={styles.Score}>{entry.score}</span>
      </span>
      {entry.mult !== undefined && <span class={styles.Mult}>{entry.mult}</span>}
    </div>
  );
}

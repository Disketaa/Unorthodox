import { CharacterColor, CharacterId, PlayerId } from '@/Core';
import { slotLimit } from './SlotLimit';
import { PlayerBarSlot } from './PlayerBarSlot';
import { slotsFor } from './PlayerBarSlots';
import styles from './PlayerBar.module.css';
import { useEffect, useState } from 'preact/hooks';

/** One player as the bar draws them: who they are, and whether they are still here. */
export interface PlayerBarEntry {
  id: PlayerId;
  /** What this player is called, drawn above their hexagon. Cut short in the drawing rather than
   * in the data, so a long name stays whole for anything that can read it. */
  name: string;
  /** What they are on across the rounds so far, drawn in place of the name under the pointer.
   * Zero in the phases that send no scores, which is every phase before the first is settled. */
  score: number;
  character: CharacterId;
  color: CharacterColor;
  /** Whether the host still has this player on the line. */
  isOnline?: boolean;
  /** Whether this player is still at work, which draws the loading mark in place of their
   * character. Purely what the bar shows; nothing in the room turns on it yet. */
  isTurning?: boolean;
}

export interface PlayerBarProps {
  /** The room's roster, in the order the room holds it. */
  players: readonly PlayerBarEntry[];
  /** This browser's own player, filled in the accent so a full bar is still findable. */
  ownPlayerId?: PlayerId | null;
}

/** Whether a straight row of `seats` hexagons, none of them below the floor, fits the screen.
 * Read from the stylesheet's own tokens rather than restated here, so the row and the test that
 * guards it cannot drift from the values the drawing is actually made of. */
function fitsLine(seats: number): boolean {
  const view = document.documentElement;
  const num = (token: string) => Number.parseFloat(getComputedStyle(view).getPropertyValue(token));
  const room = view.clientWidth - 2 * num('--Layout-ScreenPaddingHorizontal');
  return seats * num('--Layout-PlayerBarStraight') * num('--Size-PlayerBarSeatMin') <= room;
}

/** Every player in the room along the top of the game, one hexagon each. The same bar for every
 * phase, so a seat does not move between writing and the scores. */
export function PlayerBar({ players, ownPlayerId = null }: PlayerBarProps) {
  const slots = slotsFor(players, ownPlayerId, slotLimit());
  const [compact, setCompact] = useState(false);

  // Which of the two arrangements the row takes is a fact about the viewport and the count alone.
  // Nothing reads the rendered row back, which is what would let the two states chase each other
  // and strobe while a window is being dragged.
  useEffect(() => {
    const decide = () => setCompact(!fitsLine(slots.length));
    decide();
    window.addEventListener('resize', decide);
    return () => window.removeEventListener('resize', decide);
  }, [slots.length]);

  // The count is the one thing the stylesheet cannot work out for itself; it divides the screen's
  // width by it to size a seat, and reads it again to size a seat for the tiling.
  const sizing = `--Layout-PlayerBarSeats: ${slots.length}`;
  const classes = [styles.Root, compact ? styles.Compact : ''].filter(Boolean).join(' ');

  return (
    <div class={classes} style={sizing}>
      {slots.map((player, index) => (
        <PlayerBarSlot
          key={player.id}
          entry={player}
          index={index}
          isSelf={player.id === ownPlayerId}
        />
      ))}
    </div>
  );
}

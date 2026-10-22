import { createPortal } from 'preact/compat';
import styles from './Confetti.module.css';

/** How many pieces the burst holds. Any count works: each piece carries its own column, colour,
 * shape, length and start. */
const Pieces = 36;

/** Every piece's index, drawn once so both skies are built from the same pieces. */
const Indices = Array.from({ length: Pieces }, (_, index) => index);

/** A stable scatter in `[0, 1)` for a piece. The same index always lands in the same place, so
 * the burst is a scatter of separate particles and a re-render leaves it where it was. */
function scatter(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Where across the stage a piece falls, as a percentage of the field's width. */
function leftOf(index: number): string {
  return `${(scatter(index, 1) * 100).toFixed(2)}%`;
}

/** Whether a piece falls behind the player rather than over them. A scattered split off the
 * piece index, so the two skies interleave. */
function fallsBehind(index: number): boolean {
  return scatter(index, 2) < 0.5;
}

/** Confetti over a winner: pieces fall from the top, each on its own column, colour, shape,
 * length and start. Some fall behind the player and some over them for depth. Put on the body
 * so the same sky falls over whatever the room is shown. */
export function Confetti({ paused = false }: { paused?: boolean }) {
  const field = `${styles.Field}${paused ? ` ${styles.Paused}` : ''}`;
  return createPortal(
    <>
      <div class={`${field} ${styles.Behind}`} aria-hidden="true">
        {Indices.map((index) =>
          fallsBehind(index) ? (
            <i key={index} class={styles.Piece} style={{ left: leftOf(index) }} />
          ) : null
        )}
      </div>
      <div class={`${field} ${styles.Above}`} aria-hidden="true">
        {Indices.map((index) =>
          fallsBehind(index) ? null : (
            <i key={index} class={styles.Piece} style={{ left: leftOf(index) }} />
          )
        )}
      </div>
    </>,
    document.body
  );
}

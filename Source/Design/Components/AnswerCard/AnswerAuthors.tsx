import { Pop } from '@/Design/Primitives';
import { playSound } from '../../Sounds';
import { PlayerBar } from '../PlayerBar';
import type { AnswerAuthor } from './AnswerCardProps';
import styles from './AnswerCard.module.css';

/** How many writers a card names at the roomiest, before the seats start giving up their size. A
 * card is not wide enough for a room, and the room has to be able to read the answer on it. */
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

/** Who wrote this answer, in the corner, once the room has had its moment with the sentence
 * itself: one seat per writer, each landing on its own beat. Drawn on a blank card too, and
 * there it is the whole point of the card. */
export function Authors({
  authors,
  delays,
  shown,
  ownPlayerId,
}: {
  authors: readonly AnswerAuthor[] | undefined;
  delays: readonly number[] | undefined;
  shown: boolean;
  ownPlayerId: string | null | undefined;
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
        <Author
          key={author.id}
          author={author}
          delay={delays?.[index] ?? 0}
          ownPlayerId={ownPlayerId}
        />
      ))}
    </div>
  );
}

/** One writer's seat. Each lands on its own beat and the room hears it land: a sound per badge,
 * not one at the end of the wave, which is what the mute's own pop already does. */
function Author({
  author,
  delay,
  ownPlayerId,
}: {
  author: AnswerAuthor;
  delay: number;
  ownPlayerId: string | null | undefined;
}) {
  return (
    <Pop
      trigger={author.id}
      delay={`${delay}ms`}
      squash="0"
      onStart={delay === 0 ? undefined : onBadgeLand}
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
  );
}

/** Fires when a badge lands, so the room hears each one come up rather than the wave as a whole.
 * The first badge is silent: it comes up with the card, which already has its own sound. */
function onBadgeLand() {
  playSound('Pop');
}

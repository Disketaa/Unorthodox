import { useRef } from 'preact/hooks';
import { Character, Confetti, useFittedText } from '@/Design/Components';
import { useSwayMotion } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { lookFor } from '@/Screens';
import { CharacterId, CharacterColor } from '@/Core';
import type { GameSessionView } from '../Hooks/GameSessionView';
import type { RoomWinner } from './GameOver';
import styles from './WinningView.module.css';

function WinnerContent({
  name,
  look,
  paused,
  behindName,
  aboveName,
  sway,
}: {
  name: string;
  look: { character: CharacterId; color: CharacterColor } | undefined;
  paused: boolean;
  behindName: React.RefObject<HTMLSpanElement>;
  aboveName: React.RefObject<HTMLSpanElement>;
  sway: { current: HTMLDivElement | null };
}) {
  return (
    <div class={styles.Winner} ref={sway}>
      {look !== undefined && <Confetti paused={paused} />}
      <span class={`${styles.Name} ${styles.NameBehind}`}>
        <span class={styles.NameText} ref={behindName}>
          {name}
        </span>
      </span>
      <div class={styles.Portrait}>
        {look === undefined ? (
          <span class={styles.NoWinner} aria-hidden="true" />
        ) : (
          <Character character={look.character} color={look.color} size="Fill" />
        )}
      </div>
      <span class={`${styles.Name} ${styles.NameAbove}`} aria-hidden="true">
        <span class={styles.NameText} ref={aboveName}>
          {name}
        </span>
      </span>
    </div>
  );
}

export function WinnerPanel({
  view,
  winner,
  paused,
}: {
  view: GameSessionView;
  winner: RoomWinner | undefined;
  paused: boolean;
}) {
  const look = winner === undefined ? undefined : lookFor(view.playerLooks, winner.id);
  const name =
    winner === undefined
      ? Strings.phase.noWinner
      : (view.playerNames.get(winner.id) ?? winner.id);
  const [behindName, aboveName] = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];
  const sway = useSwayMotion<HTMLDivElement>();
  useFittedText(behindName, name, '--WinnerName-Fit', 0.08);
  useFittedText(aboveName, name, '--WinnerName-Fit', 0.08);
  return (
    <WinnerContent
      name={name}
      look={look}
      paused={paused}
      behindName={behindName}
      aboveName={aboveName}
      sway={sway}
    />
  );
}

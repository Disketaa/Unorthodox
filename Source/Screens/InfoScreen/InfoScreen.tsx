import { Button, Card } from '@/Design/Components';
import { Strings } from '@/Content';
import styles from './InfoScreen.module.css';

export interface InfoScreenProps {
  /** The one thing worth saying, said in a sentence. */
  message: string;
  /** What the button does. Always something that gets the player unstuck. */
  onAcknowledge: () => void;
}

/**
 * The screen shown in place of the game when there is nothing to play: a plank
 * carrying one message and a button that acknowledges it.
 *
 * One screen for every case, so a player who lands on one learns it the same way
 * as any other. No heading and no alarm colour, because neither tells them anything
 * the sentence does not: the message is the whole screen, and a coloured banner
 * would be a second, louder thing to read on a screen with one fact in it.
 */
export function InfoScreen({ message, onAcknowledge }: InfoScreenProps) {
  return (
    <div class={styles.Root}>
      <Card variant="Elevated">
        <span class={styles.Message}>{message}</span>
      </Card>
      <Button variant="Primary" size="Large" onClick={onAcknowledge}>
        {Strings.common.ok}
      </Button>
    </div>
  );
}

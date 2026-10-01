import { Banner, Button } from '@/Design/Components';
import { Strings } from '@/Content';
import styles from './InfoScreen.module.css';

export interface InfoScreenProps {
  /** The one thing worth saying, said in a sentence. */
  message: string;
  /** What the button does. Always something that gets the player unstuck. */
  onAcknowledge: () => void;
}

/**
 * The screen shown in place of the game when there is nothing to play: the info
 * block every other note in the game is drawn in, and one button that acknowledges
 * it.
 *
 * One screen for every case, so a player who lands on one learns it the same way as
 * any other. No heading and no alarm colour: the message is the whole screen, and a
 * heading above it would be a second thing to read about a single fact.
 */
export function InfoScreen({ message, onAcknowledge }: InfoScreenProps) {
  return (
    <div class={styles.Root}>
      <Banner variant="Info" align="Center">
        {message}
      </Banner>
      <Button variant="Primary" size="Large" onClick={onAcknowledge}>
        {Strings.common.ok}
      </Button>
    </div>
  );
}

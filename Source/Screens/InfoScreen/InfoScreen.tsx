import { Banner, BannerMark, Button } from '@/Design/Components';
import { Strings } from '@/Content';
import styles from './InfoScreen.module.css';

export interface InfoScreenProps {
  /** The one thing worth saying, said in a sentence. */
  message: string;
  /** What the button does. Always something that gets the player unstuck. */
  onAcknowledge: () => void;
  /**
   * The mark at the head of the plank. Defaults to the one that says something,
   * which is right for a screen reporting a fact; a screen reporting that it is
   * still waiting passes the mark that says so.
   */
  mark?: BannerMark;
  /**
   * What the button is called, where the screen's own meaning calls for its own
   * word. Defaults to acknowledging, which is what a settled fact wants. A screen
   * that is still waiting has not settled anything, so acknowledging there would
   * be a button promising an outcome the screen cannot deliver.
   */
  action?: string;
}

/**
 * The screen shown in place of the game when there is nothing to play: the info
 * block every other note in the game is drawn in, and one button that gets the
 * player out of it.
 *
 * One screen for every case, so a player who lands on one learns it the same way as
 * any other. No heading and no alarm colour: the message is the whole screen, and a
 * heading above it would be a second thing to read about a single fact.
 *
 * The connecting screen is this one rather than a banner on its own, because it is
 * the same situation seen a moment earlier: the game is not here yet, there is one
 * sentence saying so, and one button that gets the player unstuck. A separate
 * screen for it would be the same layout written twice.
 */
export function InfoScreen({ message, onAcknowledge, mark = 'Info', action }: InfoScreenProps) {
  return (
    <div class={styles.Root}>
      <Banner variant="Info" align="Center" mark={mark}>
        {message}
      </Banner>
      <Button variant="Primary" size="Large" onClick={onAcknowledge}>
        {action ?? Strings.common.ok}
      </Button>
    </div>
  );
}

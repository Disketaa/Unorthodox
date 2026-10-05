import { Banner, BannerMark, Button } from '@/Design/Components';
import { Screen, Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';

export interface InfoScreenProps {
  /** The one thing worth saying, said in a sentence. */
  message: string;
  /** What the button does. Always something that gets the player unstuck. */
  onAcknowledge: () => void;
  /** The mark at the head of the plank. Defaults to the one that says something, which is right
   * for a screen reporting a fact; a screen reporting that it is still waiting passes the mark
   * that says so. */
  mark?: BannerMark;
  /** What the button is called, where the screen's own meaning calls for its own word. Defaults
   * to acknowledging, which is what a settled fact wants; a screen still waiting has settled
   * nothing and would be promising an outcome it cannot deliver. */
  action?: string;
}

/** The screen shown in place of the game when there is nothing to play. One screen for every
 * case, so a player who lands on one learns it as any other. No heading and no alarm colour:
 * the message is the whole screen. The connecting screen is this one seen early. */
export function InfoScreen({ message, onAcknowledge, mark = 'Info', action }: InfoScreenProps) {
  return (
    <Screen vertical="Center">
      <Stack gap="Md" align="Center">
        <Banner variant="Info" align="Center" mark={mark}>
          {message}
        </Banner>
        <Button variant="Primary" size="Large" onClick={onAcknowledge}>
          {action ?? Strings.common.ok}
        </Button>
      </Stack>
    </Screen>
  );
}

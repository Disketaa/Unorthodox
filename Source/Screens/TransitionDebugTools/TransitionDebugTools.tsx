import { IconButton } from '@/Design/Components';
import { Strings } from '@/Content';

export interface TransitionDebugToolsProps {
  /** Plays the phase-change splash on this device, so it can be looked at without waiting out a
   * round to reach the phase it belongs to. */
  onReplay: () => void;
}

/** What the dock offers for the splash: the movement, on demand. Only the host's dock, and only
 * in the lobby, since the splash is a thing to look at rather than a thing to play with. */
export function TransitionDebugTools({ onReplay }: TransitionDebugToolsProps) {
  return <IconButton icon="Transition" label={Strings.phaseSplash.replay} onClick={onReplay} />;
}

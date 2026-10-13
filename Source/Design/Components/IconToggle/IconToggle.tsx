import { IconButton, type IconName } from '../IconButton';

export interface IconToggleProps {
  /** Whether the thing the control governs is on. The mark and the label both read from this, so
   * the two cannot disagree about what the button is for. */
  on: boolean;
  /** The mark for each of the two states. */
  icons: { on: IconName; off: IconName };
  /** What pressing the control does, for anyone who cannot see the mark. The label is the action
   * rather than the state, so it reads as the opposite of `on`. */
  labels: { turnOn: string; turnOff: string };
  onToggle: () => void;
}

/** One control with two faces rather than two controls, since only one of them is ever the thing
 * to press. Shared by every switch in the room, so the sounds and the music cannot drift apart
 * in how they are drawn or in what they say. */
export function IconToggle({ on, icons, labels, onToggle }: IconToggleProps) {
  return (
    <IconButton
      icon={on ? icons.on : icons.off}
      label={on ? labels.turnOff : labels.turnOn}
      onClick={onToggle}
    />
  );
}

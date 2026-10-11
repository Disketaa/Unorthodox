import { IconButton } from '../IconButton';
import { useVolumeToggle } from './UseVolume';

export interface VolumeButtonProps {
  /** What the control says it does in each of its two states, for anyone who cannot see the
   * mark. */
  labels: { mute: string; unmute: string };
}

/** Turns the room's sounds on and off. One control with two faces rather than two controls,
 * since only one of them is ever the thing to press. */
export function VolumeButton({ labels }: VolumeButtonProps) {
  const { muted, onToggleVolume } = useVolumeToggle();
  return (
    <IconButton
      icon={muted ? 'VolumeOff' : 'VolumeOn'}
      label={muted ? labels.unmute : labels.mute}
      onClick={onToggleVolume}
    />
  );
}

import { useChannelToggle } from '../../Audio/UseChannelToggle';
import { soundsChannel } from '../../Sounds';
import { IconToggle } from '../IconToggle';

export interface VolumeButtonProps {
  /** What the control says it does in each of its two states, for anyone who cannot see the
   * mark. */
  labels: { mute: string; unmute: string };
}

/** Turns the room's sounds on and off — the presses, the beats and the alarms, and not the
 * music, which has its own switch beside this one. */
export function VolumeButton({ labels }: VolumeButtonProps) {
  const { on, onToggle } = useChannelToggle(soundsChannel);
  return (
    <IconToggle
      on={on}
      icons={{ on: 'VolumeOn', off: 'VolumeOff' }}
      labels={{ turnOn: labels.unmute, turnOff: labels.mute }}
      onToggle={onToggle}
    />
  );
}

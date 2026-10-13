import { useChannelToggle } from '../../Audio/UseChannelToggle';
import { musicChannel } from '../../Music';
import { IconToggle } from '../IconToggle';

export interface MusicButtonProps {
  /** What the control says it does in each of its two states, for anyone who cannot see the
   * mark. */
  labels: { musicOn: string; musicOff: string };
}

/** Turns the music on and off, and only the music: the room's own sounds have the switch beside
 * this one, and somebody who wants the presses without the track has to be able to say so. */
export function MusicButton({ labels }: MusicButtonProps) {
  const { on, onToggle } = useChannelToggle(musicChannel);
  return (
    <IconToggle
      on={on}
      icons={{ on: 'MusicOn', off: 'MusicOff' }}
      labels={{ turnOn: labels.musicOn, turnOff: labels.musicOff }}
      onToggle={onToggle}
    />
  );
}

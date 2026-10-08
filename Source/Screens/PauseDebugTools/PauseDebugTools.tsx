import { IconButton } from '@/Design/Components';
import { Strings } from '@/Content';

export interface PauseDebugToolsProps {
  /** Whether the room is held, so the control says what it will do rather than what it did. */
  paused: boolean;
  onSetPaused: (paused: boolean) => void;
}

/** Holding the room, or letting it run. Always in the dock, whatever the phase: a room can be
 * held in any of them, and a control that appeared and vanished with the phase would be gone at
 * exactly the moment a host watching a room move too fast reached for it. */
export function PauseDebugTools({ paused, onSetPaused }: PauseDebugToolsProps) {
  return (
    <IconButton
      icon={paused ? 'Play' : 'Pause'}
      label={paused ? Strings.pause.resume : Strings.pause.hold}
      onClick={() => {
        onSetPaused(!paused);
      }}
    />
  );
}

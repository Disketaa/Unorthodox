import { useCallback, useState } from 'preact/hooks';
import { isMuted, setMuted } from '../../Sounds';

/** Whether the room's sounds are on, and the control that turns them off. Read from the bank
 * rather than kept in step by hand: the bank is the single source, and the button only asks it
 * for the answer. */
export function useVolumeToggle(): { muted: boolean; onToggleVolume: () => void } {
  const [muted, setMutedState] = useState(isMuted);

  const onToggleVolume = useCallback(() => {
    setMutedState((current) => {
      const next = !current;
      setMuted(next);
      return next;
    });
  }, []);

  return { muted, onToggleVolume };
}

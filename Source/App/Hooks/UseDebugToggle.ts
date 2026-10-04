import { useCallback, useEffect, useState } from 'preact/hooks';
import { isDebugEnabled, setDebugEnabled } from '@/Network/Diagnostics';

/** The key the host presses, under both keyboard layouts, so nobody has to guess. */
const keys = ['*', 'Multiply'];

/**
 * Whether the host is debugging this room, and the key that flips it.
 *
 * Only the host gets the key: the console belongs to the device that runs the room, so a guest
 * pressing "*" would be logging its own tab and changing nothing anyone else can see.
 *
 * Seeded from the flag itself rather than from "nobody has pressed the key yet", because the
 * room unmounts and mounts again whenever the host leaves and comes back while the flag is
 * still on — and a state that starts as "off" makes that first press after coming back turn the
 * console off instead of showing the dock that was already there. One press is one change from
 * where the flag actually is.
 *
 * And held to the host on the way out as well as on the way in, since a guest whose own link
 * carries ?debug would otherwise be shown the host's dock, and the flag it reads is this
 * device's rather than the room's.
 */
export function useDebugToggle(host: boolean): {
  debugEnabled: boolean;
  onToggleDebug: () => void;
} {
  const [debugEnabled, setDebugState] = useState(isDebugEnabled);

  const onToggleDebug = useCallback(() => {
    setDebugState((current) => {
      const next = !current;
      setDebugEnabled(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!host) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!keys.includes(event.key)) return;
      // Typing a name or a room code must not be read as a request to debug.
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest('input, textarea, [contenteditable]')) return;
      event.preventDefault();
      onToggleDebug();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [host, onToggleDebug]);

  return { debugEnabled: host && debugEnabled, onToggleDebug };
}

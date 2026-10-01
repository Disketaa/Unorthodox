import { useCallback, useEffect, useState } from 'preact/hooks';
import { isDebugEnabled, setDebugEnabled } from '@/Network/Diagnostics';

/** The key the host presses, under both keyboard layouts, so nobody has to guess. */
const keys = ['*', 'Multiply'];

/**
 * Whether the host is debugging this room, and the key that flips it.
 *
 * Only the host gets the key: the console belongs to the device that runs the
 * room, so a guest pressing "*" would be logging its own tab and changing nothing
 * anyone else can see.
 *
 * False until the key is first pressed, since a session that arrived with ?debug has
 * nothing to announce about a note the host never asked for.
 */
export function useDebugToggle(host: boolean): {
  debugEnabled: boolean;
  onToggleDebug: () => void;
} {
  const [debugEnabled, setDebugState] = useState<boolean | null>(null);

  const onToggleDebug = useCallback(() => {
    setDebugState((current) => {
      const next = !(current ?? isDebugEnabled());
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

  return { debugEnabled: debugEnabled === true, onToggleDebug };
}

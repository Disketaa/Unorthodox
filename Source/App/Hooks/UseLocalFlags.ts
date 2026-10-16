import { useState } from 'preact/hooks';

/** What this browser knows that the room has not been told: that the host walked away, and that
 * a sent answer is being written over. The latter lives here because the bar drawing it is not
 * a child of the writing screen. */
export function useLocalFlags(): {
  hostLeft: boolean;
  editing: boolean;
  bump: () => void;
  setHostLeft: (v: boolean) => void;
  markEditing: (v: boolean) => void;
} {
  const [hostLeft, setHostLeft] = useState(false);
  const [editing, markEditing] = useState(false);
  const [, setVersion] = useState(0);
  return { hostLeft, editing, bump: () => setVersion((v) => v + 1), setHostLeft, markEditing };
}

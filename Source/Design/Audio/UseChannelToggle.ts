import { useCallback, useState } from 'preact/hooks';
import type { Channel } from './Channel';

/** A switch drawn from a channel's own flag rather than kept in step by hand: the channel is the
 * single source, and the button only asks it for the answer. Local state is here so the button
 * repaints on the press, not so it can disagree with the channel. */
export function useChannelToggle(channel: Channel): {
  on: boolean;
  onToggle: () => void;
} {
  const [on, setOnState] = useState(channel.enabled);

  const onToggle = useCallback(() => {
    setOnState((current) => {
      const next = !current;
      channel.setEnabled(next);
      return next;
    });
  }, [channel]);

  return { on, onToggle };
}

import { useCallback, useEffect, useState } from 'preact/hooks';

/** Whether the window is filled, and the control that fills it. Read off the document rather
 * than kept in step by hand: the browser leaves fullscreen on its own — Esc, F11 — and a flag
 * only the button wrote would go on claiming the room was full. */
export function useFullscreen(): {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
} {
  const [isFullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const onToggleFullscreen = useCallback(() => {
    // Where there is no fullscreen at all the press does nothing: an embedded frame may
    // refuse it, and a press must not depend on the browser allowing it.
    if (typeof document.documentElement.requestFullscreen !== 'function') return;
    const ask = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    // A refusal arrives as no `fullscreenchange`, so there is nothing to correct here.
    ask.catch(() => undefined);
  }, []);

  return { isFullscreen, onToggleFullscreen };
}

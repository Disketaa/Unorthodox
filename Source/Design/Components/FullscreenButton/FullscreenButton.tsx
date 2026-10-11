import { IconButton } from '../IconButton';
import { useFullscreen } from './UseFullscreen';

export interface FullscreenButtonProps {
  /** What the control says it does in each of its two states, for anyone who cannot see the
   * mark. */
  labels: { fullscreen: string; minimize: string };
}

/** Fills the window with the page, and gives it back. One control with two faces rather than two
 * controls, since only one of them is ever the thing to press. */
export function FullscreenButton({ labels }: FullscreenButtonProps) {
  const { isFullscreen, onToggleFullscreen } = useFullscreen();
  return (
    <IconButton
      icon={isFullscreen ? 'Minimize' : 'Fullscreen'}
      label={isFullscreen ? labels.minimize : labels.fullscreen}
      onClick={onToggleFullscreen}
    />
  );
}

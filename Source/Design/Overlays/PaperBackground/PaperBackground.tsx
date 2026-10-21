import { TextureOverlay } from '../TextureOverlay';

/** A seamless paper texture laid over the whole app, drifting the way paper shifts under a lamp.
 * The movement belongs to the overlay every texture shares, so this is the sheet and nothing
 * else. */
export function PaperBackground() {
  return <TextureOverlay variant="Paper" />;
}

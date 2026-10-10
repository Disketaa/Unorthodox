import { PhaseSplash } from './PhaseSplash';

/** The room announcing it has moved on: the mark standing in the middle of the room's yellow. On
 * its own, since it is a full-viewport overlay the gallery would lose under everything else. */
export function PhaseSplashGallery() {
  return <PhaseSplash label="Фаза сменилась" />;
}

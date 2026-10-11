import { loadMuted, saveMuted } from './MutedStorage';

/** Whether the room's sounds are on. Read from storage, so a reload comes back as quiet as the
 * player left it. */
let muted = loadMuted();
/** The one bus every note goes out through, once the bank has made one. */
let bus: GainNode | undefined;
let watching = false;

/** Whether the room's sounds are on. The flag is the source of truth; the bus gain follows it. */
export function isMuted(): boolean {
  return muted;
}

/** Turns the room's sounds on or off, and tells the bus to follow. Where there is no bus yet the
 * choice is remembered, since the bus is made on the first ask. */
export function setMuted(next: boolean): void {
  muted = next;
  saveMuted(next);
  if (bus) bus.gain.value = gainFor();
}

/** Hands the bank's bus to this control, at the volume the mute and the tab's visibility ask
 * for. Cut on the bus rather than by refusing to play: notes already sounding have to be cut
 * too, and a hidden tab's beat has to be cut as well, since nobody is there to hear it. */
export function muteBus(under: GainNode): void {
  bus = under;
  under.gain.value = gainFor();
  if (watching || typeof document === 'undefined') return;
  watching = true;
  document.addEventListener('visibilitychange', () => {
    if (bus) bus.gain.value = gainFor();
  });
}

/** The bus gain: off where the tab is hidden or the room is muted, one otherwise. One place
 * decides, so a hidden tab cannot drag the sounds back on after the room mutes them. */
function gainFor(): number {
  return muted || document.hidden ? 0 : 1;
}

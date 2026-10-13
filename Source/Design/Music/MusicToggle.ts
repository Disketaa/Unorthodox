import { makeToggleStorage } from '../Audio/ToggleStorage';
import { makeChannel, type Channel } from '../Audio/Channel';

/** Whether this device last asked for no music, in localStorage rather than the tab, and on
 * unless it was asked for off: music that has never been switched off is music, and a first
 * visit that arrived silent because nobody had pressed anything would read as a broken page. */
export const musicStorage = makeToggleStorage('unorthodox.musicOn', true);

/** The music, as a channel of its own. Separate from the room's sounds so either can be switched
 * off without the other following it: somebody playing with the room quiet still wants the
 * track, and somebody on a phone in a lecture wants neither. */
export const musicChannel: Channel = makeChannel(musicStorage);

/** Whether the music is playing. */
export function isMusicOff(): boolean {
  return !musicChannel.enabled();
}

export function setMusicOff(next: boolean): void {
  musicChannel.setEnabled(!next);
}

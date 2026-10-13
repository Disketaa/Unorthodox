import { makeChannel, type Channel } from '../Audio/Channel';
import { soundsStorage } from './MutedStorage';

/** The room's sounds, as one channel: the bank plays out through whatever node it adopts here. */
export const soundsChannel: Channel = makeChannel(soundsStorage);

/** Whether the room's sounds are on. */
export function isMuted(): boolean {
  return !soundsChannel.enabled();
}

/** Turns the room's sounds on or off. */
export function setMuted(next: boolean): void {
  soundsChannel.setEnabled(!next);
}

/** Hands the bank's bus to this control, which then governs it. */
export function muteBus(under: GainNode): void {
  soundsChannel.adopt(under);
}

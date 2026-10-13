import { makeToggleStorage } from '../Audio/ToggleStorage';

/** Whether this device last asked for quiet, in localStorage rather than the tab: a player who
 * muted the room did so for the room and not for the page they happened to be on. Stored the
 * channel's way round, heard rather than quiet, so both channels are read the same way. */
export const soundsStorage = makeToggleStorage('unorthodox.soundsOn', true);

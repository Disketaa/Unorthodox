import { audioContext } from '../Audio/Context';
import { musicChannel } from './MusicToggle';

/** How fast the music gets out of the way for a held room. Shorter than a track change, since
 * nothing is being replaced here: the same track is still there when the room is let go. */
const HoldFadeSeconds = 0.3;

let bus: GainNode | undefined;
/** The hold, which every track passes through on its way to the bus. Its own gain rather than
 * the bus's, since the switch owns the bus and the room being held is a different fact about
 * it. */
let hold: GainNode | undefined;
/** Whether the room is held, kept beside the node so a track starting under a hold is made
 * silent rather than arriving loud and being faded down after it. */
let held = false;

/** Moves a gain to a level over a stretch, from wherever it happens to be now. Written as a ramp
 * rather than a jump because the whole point is not to be a jump. */
export function fade(
  context: AudioContext,
  gain: GainNode,
  level: number,
  seconds: number
): void {
  const now = context.currentTime;
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(level, now + seconds);
}

/** The bus every track plays out through, made on the first ask and handed to the music's own
 * channel, so the switch beside the volume switch governs this and not the room's clips. */
function busFor(context: AudioContext): GainNode {
  if (bus) return bus;
  const made = context.createGain();
  made.connect(context.destination);
  bus = made;
  musicChannel.adopt(made);
  return made;
}

/** The node every track is faded through while the room is held. The track is not stopped for a
 * hold, since a stopped and started loop comes back at its first second and the room would hear
 * the same bar twice. */
function holdFor(context: AudioContext): GainNode {
  if (hold) return hold;
  const busward = busFor(context);
  const made = context.createGain();
  made.gain.value = held ? 0 : 1;
  made.connect(busward);
  hold = made;
  return made;
}

/** The node every track is played out through: the switch's bus behind the hold. */
export function musicBusFor(context: AudioContext): GainNode {
  return holdFor(context);
}

/** Takes the music out of hearing while the room is held, and puts it back where it was when the
 * room is let go. */
export function holdMusic(next: boolean): void {
  held = next;
  const context = audioContext();
  const made = hold;
  if (!context || !made) return;
  fade(context, made, next ? 0 : 1, HoldFadeSeconds);
}
